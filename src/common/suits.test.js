import {describe, expect, test} from 'vitest'
import {polishBidToPbn} from './suits'

describe('polishBidToPbn', () => {
    test.each([
        ['1T', '1C'],
        ['2K', '2D'],
        ['3C', '3H'],
        ['4P', '4S'],
    ])('maps %s to %s', (polish, pbn) => {
        expect(polishBidToPbn(polish)).toBe(pbn)
    })

    test.each(['1BA', 'pas', 'X', 'XX', '?', '', '8T', '1TX'])('leaves %j unchanged', bid => {
        expect(polishBidToPbn(bid)).toBe(bid)
    })
})
