import {dealResult} from './dealFilters'
import {PLAYERS, seatOf} from './hideHands'

const ROOMS = {Open: 'otwarty', Closed: 'zamknięty'}
const OTHER_ROOM = {otwarty: 'zamknięty', zamknięty: 'otwarty'}

/*
 * Victory points of a match on the WBF continuous scale: [winner, loser] for a margin of `imps` in a match of
 * `boards` deals, rounded to two decimals.
 */
export const victoryPoints = (imps, boards) => {
    const tau = (Math.sqrt(5) - 1) / 2
    const blitz = 15 * Math.sqrt(boards)
    const margin = Math.abs(imps)
    const winner = Math.min(20, 10 + 10 * (1 - tau ** (3 * margin / blitz)) / (1 - tau ** 3))
    const rounded = Math.round(winner * 100) / 100
    const points = [rounded, Math.round((20 - rounded) * 100) / 100]
    return imps >= 0 ? points : points.reverse()
}

// The side of the table of the deal where our pair sat, recognised by the names of the players.
const ourSide = deal => {
    const seats = Object.keys(PLAYERS).map(player => seatOf(deal, player)).filter(Boolean)
    if (seats.length === 0) {
        return null
    }
    return seats[0] === 'N' || seats[0] === 'S' ? 'ns' : 'ew'
}

// Who sat where in one deal of a team match, or null when the deal does not have the tags of a team match.
const tablesOf = deal => {
    const tags = deal.tags ?? {}
    const room = ROOMS[tags.Room]
    const ours = ourSide(deal)
    const other = ['OtherNorth', 'OtherSouth', 'OtherWest', 'OtherEast'].map(tag => tags[tag])
    if (!tags.Round || !room || !tags.HomeTeam || !tags.VisitTeam || !ours || other.some(name => !name)) {
        return null
    }
    return {
        round: tags.Round,
        team: ours === 'ns' ? tags.HomeTeam : tags.VisitTeam,
        opponent: ours === 'ns' ? tags.VisitTeam : tags.HomeTeam,
        ourTable: {room, ns: [tags.North, tags.South], ew: [tags.West, tags.East], ours},
        otherTable: {room: OTHER_ROOM[room], ns: other.slice(0, 2), ew: other.slice(2), ours: ours === 'ns' ? 'ew' : 'ns'},
    }
}

/*
 * The summary of a team event, read from the tags of its deals:
 * - [Round "5"] the match,
 * - [Room "Open"] or [Room "Closed"] the room of the table of the deal,
 * - [HomeTeam] the team sitting NS at that table, [VisitTeam] the team sitting EW,
 * - [OtherNorth], [OtherSouth], [OtherWest], [OtherEast] the players of the other table.
 * Our team is the one of our pair (PLAYERS). The IMPs of a match add up the "WYNIK:" of its deals.
 * Returns {team, matches: [{title, opponent, imps, vp, segments}]} or null when a deal misses any of these tags.
 * A segment is a run of deals with the same players at both tables; `deals` are its first and last position (1-based).
 */
export const matchSummary = deals => {
    if (deals.length === 0) {
        return null
    }
    const tables = deals.map(tablesOf)
    if (tables.some(table => table === null)) {
        return null
    }
    const matches = []
    tables.forEach((table, index) => {
        let match = matches.at(-1)
        if (match?.round !== table.round) {
            match = {round: table.round, title: `Runda ${table.round}`, opponent: table.opponent, segments: [], results: [],
                lineup: null}
            matches.push(match)
        }
        const lineup = JSON.stringify([table.ourTable, table.otherTable])
        if (match.lineup === lineup) {
            match.segments.at(-1).deals[1] = index + 1
        } else {
            match.lineup = lineup
            match.segments.push({deals: [index + 1, index + 1], ourTable: table.ourTable, otherTable: table.otherTable})
        }
        match.results.push(dealResult(deals[index]))
    })
    return {
        team: tables[0].team,
        matches: matches.map(({title, opponent, segments, results}) => {
            const imps = results.filter(result => result?.type === 'imp').map(result => result.value)
            const ours = imps.filter(value => value > 0).reduce((sum, value) => sum + value, 0)
            const theirs = imps.filter(value => value < 0).reduce((sum, value) => sum - value, 0)
            return {title, opponent, imps: [ours, theirs], vp: victoryPoints(ours - theirs, results.length), segments}
        }),
    }
}
