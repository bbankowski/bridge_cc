import {isPartner, nextSeat, parseBid, SEATS} from '../Training/calls'
import {auctionCalls} from './auctionCalls'

/*
 * Editing a deal: its auction (with alerts), contract, result and comment. Calls are in PBN notation ("1NT",
 * "Pass", "X", "XX"); a contract is written as in the Contract tag ("4S", "3NTX", "Pass").
 */

const noteText = (notes, number) => {
    const note = notes.find(n => new RegExp(`^\\s*${number}\\s*:`).test(n))
    return note ? note.replace(/^\s*\d+\s*:\s*/, '') : ''
}

// The calls of a parsed deal as an editable list: {dealer, calls: [{call, note}]}.
export const editableAuction = deal => {
    const calls = auctionCalls(deal.auction)
    return {
        dealer: calls[0]?.seat ?? (SEATS.includes(deal.dealer) ? deal.dealer : 'N'),
        calls: calls.map(({call: [call, note]}) => ({
            call: call === 'pas' ? 'Pass' : call,
            note: note ? noteText(deal.notes, note) : '',
        })),
    }
}

// Four passes, or three passes after a bid.
export const isAuctionComplete = calls => {
    const bid = calls.some(({call}) => parseBid(call))
    const passes = calls.length - 1 - calls.findLastIndex(({call}) => call !== 'Pass')
    return bid ? passes >= 3 : passes >= 4
}

// The final contract of a complete auction: {contract: "4SX", declarer: "W"}, or {contract: "Pass", declarer: ""}.
export const contractFromAuction = (calls, dealer) => {
    const seated = calls.map(({call}, index) => ({call, seat: nextSeat(dealer, index)}))
    const lastBidIndex = seated.findLastIndex(({call}) => parseBid(call))
    if (lastBidIndex < 0) {
        return {contract: 'Pass', declarer: ''}
    }
    const {call, seat} = seated[lastBidIndex]
    const {strain} = parseBid(call)
    const declarer = seated.find(c => isPartner(c.seat, seat) && parseBid(c.call)?.strain === strain).seat
    const doubled = seated.slice(lastBidIndex + 1).findLast(({call}) => call === 'X' || call === 'XX')?.call ?? ''
    return {contract: call + doubled, declarer}
}

const CONTRACT = /^([1-7])(C|D|H|S|NT)(X{0,2})$/

export const parseContract = contract => {
    const match = CONTRACT.exec(contract ?? '')
    return match ? {level: Number(match[1]), strain: match[2], doubled: match[3].length} : null
}

/*
 * The duplicate score for the declaring side: contract "4SX", tricks taken (0-13), vulnerable or not.
 */
export const declarerScore = (contract, tricks, vulnerable) => {
    const {level, strain, doubled} = parseContract(contract)
    const multiplier = [1, 2, 4][doubled]
    const overtricks = tricks - 6 - level
    if (overtricks < 0) {
        const down = -overtricks
        if (doubled === 0) {
            return -down * (vulnerable ? 100 : 50)
        }
        const doubledDown = vulnerable
            ? 200 + (down - 1) * 300
            : [0, 100, 300, 500][Math.min(down, 3)] + Math.max(down - 3, 0) * 300
        return -doubledDown * multiplier / 2
    }
    const trickValue = strain === 'C' || strain === 'D' ? 20 : 30
    const contractPoints = (level * trickValue + (strain === 'NT' ? 10 : 0)) * multiplier
    const game = contractPoints >= 100 ? (vulnerable ? 500 : 300) : 50
    const slam = level === 6 ? (vulnerable ? 750 : 500) : level === 7 ? (vulnerable ? 1500 : 1000) : 0
    const insult = [0, 50, 100][doubled]
    const overtrickPoints = doubled === 0 ? overtricks * trickValue : overtricks * (vulnerable ? 200 : 100) * multiplier / 2
    return contractPoints + game + slam + insult + overtrickPoints
}

// The Score tag, from the point of view of the declaring side as BridgeComposer writes it: "NS 620", "EW -100";
// "NS 0" for a passed out deal, or null if the result is not known.
export const scoreTag = (contract, declarer, tricks, vulnerableSeats) => {
    if (contract === 'Pass') {
        return 'NS 0'
    }
    if (!parseContract(contract) || !SEATS.includes(declarer) || !(tricks >= 0 && tricks <= 13)) {
        return null
    }
    const side = declarer === 'N' || declarer === 'S' ? 'NS' : 'EW'
    return `${side} ${declarerScore(contract, tricks, vulnerableSeats.includes(declarer))}`
}

// The [Auction] section and [Note] tags of the calls; alerts are numbered in order.
export const auctionLines = (dealer, calls) => {
    if (calls.length === 0) {
        return []
    }
    const notes = []
    const tokens = calls.map(({call, note}) => {
        if (!note?.trim()) {
            return call
        }
        notes.push(note.trim())
        return `${call} =${notes.length}=`
    })
    const lines = [`[Auction "${dealer}"]`]
    for (let i = 0; i < tokens.length; i += 4) {
        lines.push(tokens.slice(i, i + 4).join(' '))
    }
    return [...lines, ...notes.map((note, index) => `[Note "${index + 1}:${note.replaceAll('"', "'")}"]`)]
}
