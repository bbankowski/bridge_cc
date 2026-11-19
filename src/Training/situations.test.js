import fs from 'node:fs'
import path from 'node:path'
import {describe, expect, test} from 'vitest'
import situations from '../../trening/sytuacje.json'
import {parsePbn} from '../PbnViewer/pbn'
import {isLegal, isPartner, nextSeat, withSeats} from './calls'
import {parseHand} from './hands'

// The data in trening/sytuacje.json must match the PBN files it comes from.
const publicDir = path.join(import.meta.dirname, '../../public')
const deals = {}
const dealOf = (file, index) => {
    deals[file] ??= parsePbn(fs.readFileSync(path.join(publicDir, file), 'utf8')).deals
    return deals[file][index - 1]
}

const tag = (deal, name) => deal.rawLines.map(line => line.match(new RegExp(`^\\[${name} "(.*)"\\]`))).find(Boolean)?.[1]

const tableCalls = deal => {
    const start = deal.rawLines.findIndex(line => line.startsWith('[Auction '))
    const calls = []
    for (const line of deal.rawLines.slice(start + 1)) {
        if (line.startsWith('[')) {
            break
        }
        for (const token of line.trim().split(/\s+/)) {
            if (!token || token.startsWith('=') || token.startsWith('$')) {
                continue
            }
            if (token === 'AP') {
                calls.push('Pass', 'Pass', 'Pass')
                break
            }
            calls.push(token)
        }
    }
    return calls
}

const SEAT_TAGS = {N: 'North', E: 'East', S: 'South', W: 'West'}
const PLAYER_NAMES = {BB: /bart/i, MJ: /marek/i}

describe('trening/sytuacje.json', () => {
    test('has unique ids', () => {
        const ids = situations.map(s => s.id)
        expect(new Set(ids).size).toBe(ids.length)
    })

    test.each(situations.map(s => [s.id, s]))('%s matches its deal', (id, situation) => {
        const deal = dealOf(situation.file, situation.deal)
        expect(deal, 'deal exists').toBeDefined()
        expect(deal.board).toBe(situation.board)
        expect(deal.dealer).toBe(situation.dealer)
        expect(deal.vulnerable).toEqual(situation.vulnerable)
        expect(deal.hands[situation.seat].join('.')).toBe(situation.hand)
        const name = tag(deal, SEAT_TAGS[situation.seat])
        if (name) {
            expect(name).toMatch(PLAYER_NAMES[situation.player])
        }

        const calls = tableCalls(deal)
        const firstSeat = situation.auctionFirstSeat
        expect(firstSeat).toBe(tag(deal, 'Auction'))
        const best = Math.max(...situation.options.map(o => o.score))
        expect(best).toBe(100)

        if (situation.type === 'bid') {
            const k = situation.auction.length
            expect(calls.slice(0, k)).toEqual(situation.auction)
            expect(nextSeat(firstSeat, k)).toBe(situation.seat)
            expect(calls[k]).toBe(situation.played)
            const seated = withSeats(situation.auction, firstSeat)
            for (const option of situation.options) {
                expect(isLegal(seated, situation.seat, option.call), option.call).toBe(true)
            }
            expect(situation.options.map(o => o.call)).toContain(situation.played)
        } else {
            expect(situation.auction).toEqual(calls)
            expect(isPartner(situation.seat, situation.declarer)).toBe(false)
            const hand = parseHand(situation.hand)
            for (const card of situation.options.map(o => o.card)) {
                const ranks = hand[card[0]]
                expect(card[1] === 'x' ? /[2-9]/.test(ranks) : ranks.includes(card[1]), card).toBe(true)
            }
        }
    })
})
