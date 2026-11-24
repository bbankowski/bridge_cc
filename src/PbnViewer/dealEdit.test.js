import fs from 'node:fs'
import path from 'node:path'
import {describe, expect, test} from 'vitest'
import {auctionLines, contractFromAuction, declarerScore, editableAuction, isAuctionComplete, scoreTag} from './dealEdit'
import {parsePbn} from './pbn'

const calls = text => text.split(' ').map(call => ({call, note: ''}))

describe('editableAuction', () => {
    test('reads the calls and their alerts from a deal', () => {
        const [deal] = parsePbn(`[Dealer "E"]
[Auction "E"]
1C =1= Pass 1NT =2= AP
[Note "1:16+ PC"]
[Note "2: 8+ PC, BA"]`).deals

        expect(editableAuction(deal)).toEqual({
            dealer: 'E',
            calls: [
                {call: '1C', note: '16+ PC'}, {call: 'Pass', note: ''}, {call: '1NT', note: '8+ PC, BA'},
                {call: 'Pass', note: ''}, {call: 'Pass', note: ''}, {call: 'Pass', note: ''},
            ],
        })
    })

    test('starts at the dealer when there is no auction', () => {
        const [deal] = parsePbn('[Dealer "W"]\n[Board "4"]').deals

        expect(editableAuction(deal)).toEqual({dealer: 'W', calls: []})
    })
})

test.each([
    ['1C Pass Pass', false],
    ['1C Pass Pass Pass', true],
    ['Pass Pass Pass', false],
    ['Pass Pass Pass Pass', true],
    ['1C X XX Pass Pass Pass', true],
])('isAuctionComplete(%s) is %s', (auction, complete) => {
    expect(isAuctionComplete(calls(auction))).toBe(complete)
})

test.each([
    ['1C Pass 1H Pass 2H Pass 4H Pass Pass Pass', 'N', {contract: '4H', declarer: 'S'}],
    ['Pass 1S X Pass 2H Pass Pass 2S X XX Pass Pass Pass', 'N', {contract: '2SXX', declarer: 'E'}],
    ['1NT X Pass Pass Pass', 'W', {contract: '1NTX', declarer: 'W'}],
    ['1D 2C X Pass Pass Pass', 'N', {contract: '2CX', declarer: 'E'}],
    ['Pass Pass Pass Pass', 'S', {contract: 'Pass', declarer: ''}],
])('contractFromAuction(%s, dealer %s)', (auction, dealer, expected) => {
    expect(contractFromAuction(calls(auction), dealer)).toEqual(expected)
})

test.each([
    ['3NT', 9, false, 400],
    ['3NT', 10, true, 630],
    ['4S', 10, false, 420],
    ['2H', 9, false, 140],
    ['5C', 11, true, 600],
    ['6S', 12, false, 980],
    ['7NT', 13, true, 2220],
    ['1NTX', 7, false, 180],
    ['2SX', 8, false, 470],
    ['2SX', 9, true, 870],
    ['1HXX', 8, false, 720],
    ['4S', 9, false, -50],
    ['4S', 7, true, -300],
    ['4SX', 9, false, -100],
    ['4SX', 6, false, -800],
    ['4SX', 5, false, -1100],
    ['4SX', 8, true, -500],
    ['4SXX', 8, false, -600],
])('declarerScore(%s, %i tricks, vulnerable %s) is %i', (contract, tricks, vulnerable, score) => {
    expect(declarerScore(contract, tricks, vulnerable)).toBe(score)
})

test.each([
    ['4H', 'S', 10, ['N', 'S'], 'NS 620'],
    ['4H', 'E', 10, ['N', 'S'], 'EW 420'],
    ['3NT', 'W', 7, [], 'EW -100'],
    ['Pass', '', NaN, [], 'NS 0'],
    ['4H', '', 10, [], null],
    ['4H', 'S', NaN, [], null],
])('scoreTag(%s %s %i tricks)', (contract, declarer, tricks, vulnerable, expected) => {
    expect(scoreTag(contract, declarer, tricks, vulnerable)).toBe(expected)
})

test('computes the [Score] tags of the III league file, as BridgeComposer writes them', () => {
    const file = path.join(import.meta.dirname, '../../public/3liga_2026-2027_runda5-6.pbn')
    const {deals} = parsePbn(fs.readFileSync(file, 'utf8'))

    deals.forEach(deal => expect(scoreTag(deal.contract, deal.declarer, Number(deal.result), deal.vulnerable),
        `board ${deal.board} of ${deal.event}`).toBe(deal.score))
})

test('writes the auction four calls a line, with the alerts as notes', () => {
    expect(auctionLines('S', [
        {call: '1D', note: ''}, {call: '1S', note: ' 5+ pików '}, {call: 'X', note: 'negatywna "4+ kiery"'},
        {call: 'Pass', note: ''}, {call: '2H', note: ''},
    ])).toEqual([
        '[Auction "S"]', '1D 1S =1= X =2= Pass', '2H',
        '[Note "1:5+ pików"]', '[Note "2:negatywna \'4+ kiery\'"]',
    ])
    expect(auctionLines('N', [])).toEqual([])
})
