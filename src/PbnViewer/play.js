const SEATS = ['N', 'E', 'S', 'W']
const RANKS = 'AKQJT98765432'
const CARD = /^[SHDC][AKQJT2-9]$/

const nextSeat = (seat, steps = 1) => SEATS[(SEATS.indexOf(seat) + steps) % 4]

// The [Play "<leader>"] section: one line per trick, cards in fixed columns – the player of the tag first, then clockwise.
export const playRecord = deal => {
    const start = deal.rawLines.findIndex(line => line.startsWith('[Play '))
    if (start < 0) {
        return null
    }
    const leader = /\[Play "([NESW])"]/.exec(deal.rawLines[start])?.[1]
    const lines = []
    for (const line of deal.rawLines.slice(start + 1)) {
        if (line.startsWith('[') || line.trim() === '') {
            break
        }
        lines.push(line.trim().split(/\s+/))
    }
    return leader && lines.length > 0 ? {leader, lines} : null
}

const trumpOf = contract => /^[1-7](C|D|H|S|NT)/.exec(contract ?? '')?.[1] ?? 'NT'

const winnerOf = (trick, trump) => {
    const led = trick[0].card[0]
    const strength = ({card}) => (card[0] === trump ? 200 : card[0] === led ? 100 : 0) + (13 - RANKS.indexOf(card[1]))
    return trick.reduce((best, play) => (strength(play) > strength(best) ? play : best)).seat
}

/*
 * The recorded play in the order the cards were played: {plays: [{seat, card, trick}], tricks: [{leader, cards, winner}]}.
 * The leader of each trick is the winner of the previous one. The replay stops at an unknown card ("-") or the end ("*").
 * Returns null when the deal has no play record.
 */
export const playSequence = deal => {
    const record = playRecord(deal)
    if (!record) {
        return null
    }
    const trump = trumpOf(deal.contract)
    const column = seat => (SEATS.indexOf(seat) - SEATS.indexOf(record.leader) + 4) % 4
    const plays = []
    const tricks = []
    let leader = record.leader
    for (const line of record.lines) {
        const cards = []
        for (let k = 0; k < 4; k++) {
            const seat = nextSeat(leader, k)
            const card = line[column(seat)]
            if (!CARD.test(card ?? '')) {
                break
            }
            cards.push({seat, card})
        }
        if (cards.length === 0) {
            break
        }
        plays.push(...cards.map(play => ({...play, trick: tricks.length})))
        const winner = cards.length === 4 ? winnerOf(cards, trump) : null
        tricks.push({leader, cards, winner})
        if (!winner) {
            break
        }
        leader = winner
    }
    return {plays, tricks}
}

/*
 * The position after `step` cards: the cards already played (removed from the hands), the cards of the current trick
 * ({seat: card}) and the tricks won by each side.
 */
export const positionAfter = (sequence, step) => {
    const played = new Set(sequence.plays.slice(0, step).map(play => play.card))
    const current = step > 0 ? sequence.plays[step - 1].trick : null
    const trick = {}
    sequence.plays.slice(0, step).filter(play => play.trick === current).forEach(play => {
        trick[play.seat] = play.card
    })
    const won = {NS: 0, EW: 0}
    sequence.tricks.forEach((t, index) => {
        const completeAt = sequence.plays.findIndex(play => play.trick === index) + 4
        if (t.winner && step >= completeAt) {
            won[['N', 'S'].includes(t.winner) ? 'NS' : 'EW']++
        }
    })
    return {played, trick, won, trickNumber: current === null ? 0 : current + 1}
}
