import {describe, expect, test} from 'vitest'
import {auctionRows, isLegal, polishCallToPbn, withSeats} from './calls'

describe('isLegal', () => {
    const auction = withSeats(['1H', 'Pass', '1S'], 'N')

    test.each([
        ['1NT', 'W', true],
        ['1S', 'W', false],
        ['1C', 'W', false],
        ['2C', 'W', true],
        ['X', 'W', true],
        ['XX', 'W', false],
        ['Pass', 'W', true],
    ])('%s by %s: %s', (call, seat, expected) => {
        expect(isLegal(auction, seat, call)).toBe(expected)
    })

    test('does not allow doubling partner', () => {
        expect(isLegal(withSeats(['1H', 'Pass'], 'N'), 'S', 'X')).toBe(false)
    })

    test('allows a redouble only of an opponent double of our bid', () => {
        const doubled = withSeats(['1H', 'X'], 'N')
        expect(isLegal(doubled, 'S', 'XX')).toBe(true)
        expect(isLegal(withSeats(['1H', 'X', 'Pass'], 'N'), 'W', 'XX')).toBe(false)
    })

    test('allows any bid as the opening call', () => {
        expect(isLegal([], 'N', '1C')).toBe(true)
        expect(isLegal([], 'N', 'X')).toBe(false)
    })
})

test('polishCallToPbn', () => {
    expect(['1T', '2K', '3C', '4P', '1BA', 'pas', 'X', 'XX', 'T1T', '8T'].map(polishCallToPbn))
        .toEqual(['1C', '2D', '3H', '4S', '1NT', 'Pass', 'X', 'XX', null, null])
})

test('auctionRows lays out calls under the seats', () => {
    expect(auctionRows(withSeats(['1D', 'Pass'], 'E'), 'E')).toEqual([[null, ['1D'], ['pas'], null]])
})
