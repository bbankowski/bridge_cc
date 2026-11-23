import fs from 'node:fs'
import path from 'node:path'
import {describe, expect, test} from 'vitest'
import {dealResult} from './PbnViewer/dealFilters'
import {parsePbn} from './PbnViewer/pbn'
import {TOURNAMENTS, tournamentOf} from './tournaments'

const tagOf = (deal, tag) => deal.rawLines.map(line => new RegExp(`^\\[${tag} "(.*)"]`).exec(line)?.[1]).find(Boolean)

describe.each(TOURNAMENTS.filter(tournament => tournament.matches).map(tournament => [tournament.file, tournament]))(
    'the match summary of %s', (file, tournament) => {
        const {deals} = parsePbn(fs.readFileSync(path.join(import.meta.dirname, '../public', file), 'utf8'))
        const segments = tournament.matches.flatMap(match => match.segments)

        test('covers every deal of the file once, in order', () => {
            const positions = segments.flatMap(({deals: [first, last]}) =>
                Array.from({length: last - first + 1}, (_, i) => first + i))
            expect(positions).toEqual(deals.map((_, index) => index + 1))
        })

        test('matches the players of our table in the deals', () => {
            for (const {deals: [first, last], ourTable} of segments) {
                for (const deal of deals.slice(first - 1, last)) {
                    expect([tagOf(deal, 'North'), tagOf(deal, 'South'), tagOf(deal, 'West'), tagOf(deal, 'East')])
                        .toEqual([...ourTable.ns, ...ourTable.ew])
                }
            }
        })

        test('adds up the IMPs of the deals to the score of each match', () => {
            for (const match of tournament.matches) {
                const matchDeals = match.segments.flatMap(({deals: [first, last]}) => deals.slice(first - 1, last))
                const sum = matchDeals.reduce((total, deal) => total + (dealResult(deal)?.value ?? 0), 0)
                expect(sum).toBe(match.imps[0] - match.imps[1])
            }
        })
    })

test('finds a tournament by its file', () => {
    expect(tournamentOf('4kroli.pbn').name).toBe('2024.01.07 Czterech Króli')
    expect(tournamentOf('nieznany.pbn')).toBeUndefined()
})
