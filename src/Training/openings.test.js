import {describe, expect, test} from 'vitest'
import {parseHand} from './hands'
import {evaluateOpening} from './openings'

const best = (hand, context) => evaluateOpening(parseHand(hand), context).best
const options = (hand, context) => Object.fromEntries(evaluateOpening(parseHand(hand), context).options
    .map(option => [option.call, option.score]))

describe('evaluateOpening', () => {
    test.each([
        // hand (S.H.D.C), expected, description
        ['KJ4.Q93.K852.A64', '1C', '13 PC 3-3-4-3: 1♣ 12-14 równy'],
        ['AQ4.K93.K852.A64', '1NT', '16 PC równy: 1BA'],
        ['AJ43.Q9.85.AKJ64', '1C', '15 PC, 5 trefli: 1♣ (15+ z piątką trefli)'],
        ['AQ4.K93.KQ52.A64', '1C', '19 PC: 1♣ 18+'],
        ['KJ4.Q93.5.AKJ642', '2C', '12 PC, 6 trefli: 2♣'],
        ['KJ43.Q9.85.AQJ64', '2C', '13 PC, 5♣ + 4♠: 2♣'],
        ['AJ4.Q93.K8.KQJ64', '1NT', '16 PC 5332: 1BA'],
        ['KJ4.Q9.K8.AQJ642', '1NT', '16 PC 6322 z treflami: 1BA'],
        ['AJ4.Q9.K8.AQJ642', '1NT', '16 PC 6322: 1BA'],
        ['AJ43.Q.K8.AKJ642', '1C', '17 PC, 6 trefli niezrównoważony: 1♣'],
        ['AJ4.Q.KQ84.KJ642', '1D', '16 PC 3-1-4-5: 1♦ (4 kara i 5 trefli)'],
        ['KJ4.Q.K852.AJ642', '1D', '12 PC 4♦ 5♣: 1♦'],
        ['KJ43.Q.K852.AJ64', '1D', '13 PC 4441: 1♦'],
        ['KJ43.QJ93.K852.A', '1D', '14 PC 4441 z singlem trefl: 1♦'],
        ['KQJ43.Q9.Q85.A64', '1S', '14 PC, 5 pików: 1♠'],
        ['AQ4.KJ943.K8.A64', '1NT', '17 PC 5♥332: zawsze 1BA'],
        ['Q4.KJ9432.K8.A64', '1H', '13 PC, 6 kierów: 1♥'],
        ['KQJ43.AJ943.K8.6', '1S', '5-5 w starszych: wyższy kolor'],
        ['K4.Q9.AJ9843.A64', '1D', '6 kar: 1♦'],
        ['K4.Q9.AJ984.K864', '1D', '13 PC 5♦ 4♣: 1♦'],
        ['Q4.KJ9432.85.864', '2D', '6 PC, 6 kierów: mini-multi 2♦'],
        ['KJ943.Q.86.QJ864', '2S', '9 PC, 5♠ 5♣: 2♠'],
        ['8.KJ943.QJ864.86', '2H', '8 PC, 5♥ 5♦: 2♥'],
        ['8.K9.QJ864.KT864', '2NT', '9 PC, 5♦ 5♣: 2BA'],
        ['8.Q9.J4.AKQ8642', '3NT', 'gambling'],
        ['8.K9.Q4.AKQ8642', '2C', '14 PC z bocznym królem: 2♣, nie gambling'],
        ['84.KQJ9842.Q4.86', '3H', 'po partii z dwiema starszymi figurami'],
        ['84.Q4.J98642.K86', 'Pass', '6 PC bez otwarcia'],
        ['KJ4.Q93.852.A64', 'Pass', '10 PC równy: pas'],
    ])('%s -> %s (%s)', (hand, expected) => {
        expect(best(hand, {vulnerable: true})).toBe(expected)
    })

    test('preempts not vulnerable with any long suit, vulnerable only with two top honours', () => {
        expect(best('84.J9875432.Q4.8', {vulnerable: false})).toBe('3H')
        expect(best('84.J9875432.Q4.8', {vulnerable: true})).toBe('Pass')
    })

    test('gives judgement calls several scores', () => {
        expect(options('AJ4.Q93.K8.KQJ64')).toMatchObject({'1NT': 100, '1C': 70})
        expect(options('AQ4.KJ943.K8.A64')).toMatchObject({'1NT': 100, '1H': 20})
        expect(options('KQJ43.K9.K85.A64')).toMatchObject({'1NT': 100, '1S': 60})
    })

    test('every option has a reason', () => {
        for (const option of evaluateOpening(parseHand('KJ4.Q93.K852.A64')).options) {
            expect(option.comment).toBeTruthy()
        }
    })
})
