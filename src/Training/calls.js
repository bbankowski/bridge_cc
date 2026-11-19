// Calls in PBN notation: "Pass", "X", "XX", "1C" … "7NT".
export const SEATS = ['N', 'E', 'S', 'W']
export const STRAINS = ['C', 'D', 'H', 'S', 'NT']
export const BIDS = [1, 2, 3, 4, 5, 6, 7].flatMap(level => STRAINS.map(strain => `${level}${strain}`))
export const ALL_CALLS = [...BIDS, 'Pass', 'X', 'XX']

const BID = /^([1-7])(C|D|H|S|NT)$/

export const parseBid = call => {
    const match = BID.exec(call)
    return match ? {level: Number(match[1]), strain: match[2], rank: (Number(match[1]) - 1) * 5 + STRAINS.indexOf(match[2])} : null
}

export const nextSeat = (seat, steps = 1) => SEATS[(SEATS.indexOf(seat) + steps) % 4]
export const isPartner = (a, b) => SEATS.indexOf(a) % 2 === SEATS.indexOf(b) % 2

// calls: [{seat, call}] made before `seat` acts.
export const isLegal = (calls, seat, call) => {
    let lastBid = null
    let lastBidder = null
    let doubled = null
    for (const {seat: s, call: c} of calls) {
        const bid = parseBid(c)
        if (bid) {
            lastBid = bid
            lastBidder = s
            doubled = null
        } else if (c === 'X' || c === 'XX') {
            doubled = c
        }
    }
    if (call === 'Pass') {
        return true
    }
    const bid = parseBid(call)
    if (bid) {
        return lastBid === null || bid.rank > lastBid.rank
    }
    if (call === 'X') {
        return lastBid !== null && doubled === null && !isPartner(seat, lastBidder)
    }
    if (call === 'XX') {
        return doubled === 'X' && isPartner(seat, lastBidder)
    }
    return false
}

// Lays out calls in rows of N/E/S/W for the Auction component: [[call, note?] | null].
export const auctionRows = (calls, firstSeat) => {
    const cells = Array(SEATS.indexOf(firstSeat)).fill(null)
    calls.forEach(({call}) => cells.push([call === 'Pass' ? 'pas' : call]))
    while (cells.length % 4 !== 0) {
        cells.push(null)
    }
    const rows = []
    for (let i = 0; i < cells.length; i += 4) {
        rows.push(cells.slice(i, i + 4))
    }
    return rows
}

// Assigns seats to a list of calls, starting with firstSeat.
export const withSeats = (calls, firstSeat) => calls.map((call, index) => ({seat: nextSeat(firstSeat, index), call}))

const POLISH_STRAINS = {T: 'C', K: 'D', C: 'H', P: 'S', BA: 'NT'}

// Converts a call of the convention card ("1T", "2BA", "pas", "X") to PBN ("1C", "2NT", "Pass", "X"); null if unknown.
export const polishCallToPbn = call => {
    if (call === 'pas') {
        return 'Pass'
    }
    if (call === 'X' || call === 'XX') {
        return call
    }
    const match = /^([1-7])(T|K|C|P|BA)$/.exec(call)
    return match ? match[1] + POLISH_STRAINS[match[2]] : null
}
