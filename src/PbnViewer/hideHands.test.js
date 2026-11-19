import {expect, test} from 'vitest'
import {seatOf} from './hideHands'

const deal = players => ({rawLines: ['[Event "x"]', ...Object.entries(players).map(([tag, name]) => `[${tag} "${name}"]`)]})

test('finds the seat of a player by name', () => {
    const d = deal({West: 'Bartek', North: '', East: 'Marek', South: ''})

    expect(seatOf(d, 'BB')).toBe('W')
    expect(seatOf(d, 'MJ')).toBe('E')
})

test('recognises full names and initials', () => {
    expect(seatOf(deal({South: 'Bartosz Bańkowski', North: 'Marek Jarosz'}), 'BB')).toBe('S')
    expect(seatOf(deal({North: 'MJ'}), 'MJ')).toBe('N')
})

test('returns null when the player is not named', () => {
    expect(seatOf(deal({West: '', East: ''}), 'BB')).toBeNull()
    expect(seatOf(deal({West: 'Bartek'}), 'XX')).toBeNull()
})
