import fs from 'node:fs'
import path from 'node:path'
import {describe, expect, test} from 'vitest'
import situations from '../../trening/sytuacje.json'
import {isLegal} from './calls'
import {parseHand} from './hands'
import {evaluateOpening} from './openings'
import {cardOpeningDescriptions, conventionQuestion, grade, openingQuestion, prepareCard, situationQuestion} from './questions'

const card = prepareCard(fs.readFileSync(path.join(import.meta.dirname, '../../bidding.txt'), 'utf8'))

// deterministic pseudo random numbers
const seeded = seed => () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
}

describe('convention card questions', () => {
    test('finds many playable sequences', () => {
        expect(card.playable.length).toBeGreaterThan(400)
    })

    test('asks for the meaning with the right answer and distractors', () => {
        const random = seeded(1)
        for (let i = 0; i < 100; i++) {
            const question = conventionQuestion(card, random)
            expect(question).not.toBeNull()
            if (question.kind === 'choice') {
                expect(question.choices.length).toBeGreaterThanOrEqual(3)
                expect(new Set(question.choices).size).toBe(question.choices.length)
                expect(question.answers.filter(a => a.score === 100)).toHaveLength(1)
                expect(question.choices).toContain(question.answers[0].value)
            } else {
                expect(question.kind).toBe('call')
                const {calls, seat} = question.auction
                expect(isLegal(calls, seat, question.answers[0].value)).toBe(true)
            }
        }
    })

    test('can be limited to a chapter', () => {
        const random = seeded(2)
        for (let i = 0; i < 20; i++) {
            expect(conventionQuestion(card, random, {chapterId: 'chapter-w-obronie'}).subtitle).toMatch(/^W obronie/)
        }
    })

    test('accepts other calls with the same meaning', () => {
        const question = conventionQuestion(card, seeded(3))
        const best = question.answers.find(a => a.score === 100)
        expect(grade(question, best.value).score).toBe(100)
        expect(grade(question, 'not a call').score).toBe(0)
    })
})

describe('opening questions', () => {
    const descriptions = cardOpeningDescriptions(card)

    test('use the opening descriptions of the card', () => {
        expect(descriptions['1D']).toMatch(/12-17 PC/)
        expect(descriptions['1NT']).toMatch(/15-17/)
    })

    test('deal hands that are opened in the system, with the system call as the best answer', () => {
        const random = seeded(4)
        const seen = new Set()
        for (let i = 0; i < 150; i++) {
            const question = openingQuestion(descriptions, random)
            const best = question.answers[0]
            expect(best.score).toBe(100)
            expect(best.value).not.toBe('Pass')
            expect(evaluateOpening(parseHand(question.hand), {
                vulnerable: question.context.vulnerable.includes(question.context.seat),
            }).best).toBe(best.value)
            expect(question.auction.calls.every(c => c.call === 'Pass')).toBe(true)
            seen.add(best.value.startsWith('3') && best.value !== '3NT' ? '3x' : best.value)
        }
        expect([...seen].sort()).toEqual(['1C', '1D', '1H', '1NT', '1S', '2C', '2D', '2H', '2NT', '2S', '3NT', '3x'])
    })
})

describe('tournament questions', () => {
    test('turn every situation into a question', () => {
        for (const situation of situations) {
            const question = situationQuestion(situation)
            expect(question.kind).toBe(situation.type === 'lead' ? 'card' : 'call')
            expect(question.links[0].to.search).toContain(`deal=${situation.deal}`)
            expect(grade(question, question.answers[0].value).score).toBe(question.answers[0].score)
        }
    })

    test('grade "any small card" lead options', () => {
        const question = {answers: [{value: 'Cx', score: 80, comment: ''}]}
        expect(grade(question, 'C4').score).toBe(80)
        expect(grade(question, 'CK').score).toBe(0)
    })
})
