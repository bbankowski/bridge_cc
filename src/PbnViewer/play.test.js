import fs from 'node:fs'
import path from 'node:path'
import {describe, expect, test} from 'vitest'
import {parsePbn} from './pbn'
import {playSequence, positionAfter} from './play'

const dealWith = (contract, playLines, leader = 'N') => ({
    contract,
    rawLines: ['[Event "x"]', `[Contract "${contract}"]`, `[Play "${leader}"]`, ...playLines, '[OptimumResultTable "x"]'],
})

describe('playSequence', () => {
    test('orders the cards of each trick from the winner of the previous one', () => {
        // columns: N E S W; S wins the first trick with HQ and leads the second
        const sequence = playSequence(dealWith('3S', ['H5 HT HQ H6', 'DA DQ D4 D2']))

        expect(sequence.plays.map(p => `${p.seat}${p.card}`)).toEqual(
            ['NH5', 'EHT', 'SHQ', 'WH6', 'SD4', 'WD2', 'NDA', 'EDQ'])
        expect(sequence.tricks.map(t => t.winner)).toEqual(['S', 'N'])
    })

    test('a trump wins over the suit led, a discard never wins', () => {
        const sequence = playSequence(dealWith('4H', ['SA S2 H2 SK', 'C3 CK D2 C4'], 'N'))

        expect(sequence.tricks[0].winner).toBe('S')
        // S leads trick 2: D2, then W C4, N C3, E CK – diamonds led, nobody follows, S wins
        expect(sequence.tricks[1].winner).toBe('S')
    })

    test('stops at an unknown card or the end of the record', () => {
        expect(playSequence(dealWith('3NT', ['SA S2 S3 S4', 'H2 - H3 H4'])).plays).toHaveLength(5)
        expect(playSequence(dealWith('3NT', ['SA S2 S3 *'])).tricks[0].winner).toBeNull()
    })

    test('a deal with only the lead has one card', () => {
        expect(playSequence(dealWith('3NT', ['DT'], 'N')).plays).toEqual([{seat: 'N', card: 'DT', trick: 0}])
    })

    test('no play record', () => {
        expect(playSequence({contract: '3NT', rawLines: ['[Event "x"]']})).toBeNull()
    })

    test('replays the recorded deals of the tournament files without losing cards', () => {
        const dir = path.join(import.meta.dirname, '../../public')
        let replayed = 0
        for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.pbn'))) {
            for (const deal of parsePbn(fs.readFileSync(path.join(dir, file), 'utf8')).deals) {
                const sequence = playSequence(deal)
                if (!sequence) {
                    continue
                }
                replayed++
                for (const {seat, card} of sequence.plays) {
                    // every played card belongs to the hand of the player who played it
                    expect(deal.hands[seat]['SHDC'.indexOf(card[0])], `${file} ${deal.board} ${seat}${card}`).toContain(card[1])
                }
            }
        }
        expect(replayed).toBeGreaterThan(90)
    })
})

test('positionAfter', () => {
    const sequence = playSequence(dealWith('3S', ['H5 HT HQ H6', 'DA DQ D4 D2']))

    expect(positionAfter(sequence, 0)).toMatchObject({trick: {}, won: {NS: 0, EW: 0}, trickNumber: 0})
    expect(positionAfter(sequence, 3)).toMatchObject({trick: {N: 'H5', E: 'HT', S: 'HQ'}, won: {NS: 0, EW: 0}, trickNumber: 1})
    expect(positionAfter(sequence, 4)).toMatchObject({won: {NS: 1, EW: 0}, trickNumber: 1})
    const afterFive = positionAfter(sequence, 5)
    expect(afterFive.trick).toEqual({S: 'D4'})
    expect([...afterFive.played]).toEqual(['H5', 'HT', 'HQ', 'H6', 'D4'])
})
