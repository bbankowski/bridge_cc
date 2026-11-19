import fs from 'node:fs'
import path from 'node:path'
import {describe, expect, test} from 'vitest'
import situations from '../../trening/sytuacje.json'
import {cardOpeningDescriptions, prepareCard} from './questions'
import {buildSession} from './session'

const card = prepareCard(fs.readFileSync(path.join(import.meta.dirname, '../../bidding.txt'), 'utf8'))
const sources = (review = []) => ({card, openingDescriptions: cardOpeningDescriptions(card), situations, review})

describe('buildSession', () => {
    test.each(['karta', 'otwarcia', 'turnieje', 'wisty'])('builds %s questions', mode => {
        const questions = buildSession({mode, count: 10}, sources())

        expect(questions).toHaveLength(10)
        expect(questions.every(q => q.mode === mode)).toBe(true)
        expect(new Set(questions.map(q => q.id)).size).toBe(10)
    })

    test('mixes all modes', () => {
        const questions = buildSession({mode: 'mieszany', count: 20}, sources())

        expect(new Set(questions.map(q => q.mode))).toEqual(new Set(['karta', 'otwarcia', 'turnieje', 'wisty']))
    })

    test('filters tournament situations by scoring', () => {
        const questions = buildSession({mode: 'turnieje', count: 20, scoring: 'maxy'}, sources())

        expect(questions.every(q => q.context.scoring === 'maxy')).toBe(true)
    })

    test('stops when the situations run out', () => {
        const lead = situations.filter(s => s.type === 'lead').length

        expect(buildSession({mode: 'wisty', count: 1000}, sources())).toHaveLength(lead)
    })

    test('adds up to 30% reviews of the chosen mode, and the review mode uses only reviews', () => {
        const review = [{id: 'r1', mode: 'karta'}, {id: 'r2', mode: 'karta'}, {id: 'r3', mode: 'karta'},
            {id: 'r4', mode: 'karta'}, {id: 'w1', mode: 'wisty'}]

        const questions = buildSession({mode: 'karta', count: 10, includeReview: true}, sources(review))
        expect(questions.filter(q => q.id.startsWith('r'))).toHaveLength(3)
        expect(questions.some(q => q.id === 'w1')).toBe(false)

        expect(buildSession({mode: 'powtorka', count: 10}, sources(review)).map(q => q.id))
            .toEqual(['r1', 'r2', 'r3', 'r4', 'w1'])
    })
})
