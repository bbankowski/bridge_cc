import fs from 'node:fs'
import path from 'node:path'
import {describe, expect, test} from 'vitest'
import {isLegal, parseBid, polishCallToPbn, withSeats} from '../Training/calls'
import {isContested, parseBidding, plainSequence, sequenceCalls, tableRows} from './bidding'

/*
 * Checks of the bidding system in bidding.txt, so mistakes in the file fail the tests instead of showing up on
 * the card: unknown or illegal calls, the opponents' calls in parentheses, the order of the answers and continuations
 * that do not belong to the table above them.
 */
const entries = parseBidding(fs.readFileSync(path.join(import.meta.dirname, '../../bidding.txt'), 'utf8'))
const sequences = entries.filter(entry => ['opening', 'table', 'bid'].includes(entry.type))
const where = entry => `${entry.sequence} (wpis ${entry.index})`

// the order of answers: pas, X, XX, then the bids from the lowest
const callRank = call => {
    const pbn = polishCallToPbn(call)
    return {Pass: -3, X: -2, XX: -1}[pbn] ?? parseBid(pbn).rank
}

describe('bidding.txt', () => {
    test('has only known calls', () => {
        const unknown = sequences.filter(entry => sequenceCalls(entry.sequence).some(({call}) => polishCallToPbn(call) === null))

        expect(unknown.map(where)).toEqual([])
    })

    test('has only legal auctions', () => {
        const illegal = sequences.filter(entry => {
            const cells = tableRows(entry.sequence).flat().map(({call}) => call)
            const auction = withSeats(cells.slice(0, cells.indexOf('?')).map(polishCallToPbn), 'N')
            return !auction.every(({seat, call}, index) => isLegal(auction.slice(0, index), seat, call))
        })

        expect(illegal.map(where)).toEqual([])
    })

    test('puts every other call of a contested auction in parentheses', () => {
        const wrong = sequences.filter(entry => isContested(entry.sequence) && !sequenceCalls(entry.sequence)
            .every((call, index, calls) => index === 0 || call.theirs !== calls[index - 1].theirs))

        expect(wrong.map(where)).toEqual([])
    })

    test('lists the answers under a table in bidding order: pas, X, XX, then from the lowest bid', () => {
        const wrong = []
        let lastAnswers = new Map()
        for (const entry of entries) {
            if (entry.type !== 'bid') {
                lastAnswers = new Map()
                continue
            }
            const calls = plainSequence(entry.sequence).split('-')
            const parent = calls.slice(0, -1).join('-')
            const previous = lastAnswers.get(parent)
            if (previous && callRank(calls.at(-1)) < callRank(previous.calls.at(-1))) {
                wrong.push(`${previous.entry.sequence} przed ${where(entry)}`)
            }
            lastAnswers.set(parent, {entry, calls})
        }

        expect(wrong).toEqual([])
    })

    test('continues the sequence of the table or the opening above it', () => {
        const wrong = []
        let anchor = null
        for (const entry of entries) {
            if (entry.type === 'chapter' || entry.type === 'section') {
                anchor = null
            } else if (entry.type === 'table' || entry.type === 'opening') {
                anchor = entry
            } else if (entry.type === 'bid' && anchor
                && !plainSequence(entry.sequence).startsWith(`${plainSequence(anchor.sequence)}-`)) {
                wrong.push(`${where(entry)} pod ${anchor.sequence}`)
            }
        }

        expect(wrong).toEqual([])
    })
})
