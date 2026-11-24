import fs from 'node:fs'
import path from 'node:path'
import {describe, expect, test} from 'vitest'
import {matchSummary, victoryPoints} from './matches'
import {parsePbn} from './pbn'

const FIXTURE = fs.readFileSync(path.join(import.meta.dirname, 'fixtures/team-match.pbn'), 'utf8')

test.each([
    [20, 20, [14.58, 5.42]],
    [-20, 20, [5.42, 14.58]],
    [92, 20, [20, 0]],
    [0, 20, [10, 10]],
])('a margin of %i IMPs in %i deals gives %j VPs on the WBF scale', (imps, boards, vp) => {
    expect(victoryPoints(imps, boards)).toEqual(vp)
})

describe('the summary of a team event, from the tags of its deals', () => {
    // boards 1, 2 and 11 of round 5 (the other table changes after board 10) and board 1 of round 6
    const summary = matchSummary(parsePbn(FIXTURE).deals)

    test('has the matches with the score from the results of the deals', () => {
        expect(summary.team).toBe('CKiS Skawina')
        expect(summary.matches.map(({title, opponent, imps, vp}) => ({title, opponent, imps, vp}))).toEqual([
            {title: 'Runda 5', opponent: 'CKiS II Skawina', imps: [11, 1], vp: [15.58, 4.42]},
            {title: 'Runda 6', opponent: 'CKiS IV Skawina', imps: [0, 0], vp: [10, 10]},
        ])
    })

    test('splits a match where the players of a table change', () => {
        const [round5, round6] = summary.matches

        expect(round5.segments.map(segment => segment.deals)).toEqual([[1, 2], [3, 3]])
        expect(round5.segments[0]).toEqual({
            deals: [1, 2],
            ourTable: {room: 'otwarty', ns: ['Tomasz Lasota', 'Mikołaj Chmielewski'], ew: ['Bartosz Bańkowski', 'Marek Jarosz'], ours: 'ew'},
            otherTable: {room: 'zamknięty', ns: ['Milena Klimiuk', 'Martyna Pucyk'], ew: ['Kacper Kisielewski', 'Antoni Wójtowicz'], ours: 'ns'},
        })
        expect(round5.segments[1].otherTable.ew).toEqual(['Adam Stachura', 'Antonina Chmielewska'])
        expect(round6.segments).toEqual([{
            deals: [4, 4],
            ourTable: {room: 'zamknięty', ns: ['Bohdan Shulha', 'Krzysztof Ziętarski'], ew: ['Marek Jarosz', 'Bartosz Bańkowski'], ours: 'ew'},
            otherTable: {room: 'otwarty', ns: ['Jakub Michalski', 'Marcel Prokopowicz'], ew: ['Marcel Miłoś', 'Franciszek Rządzik'], ours: 'ns'},
        }])
    })
})

const deal = (tags, comment = '') => [
    '[Event "Liga"]',
    ...Object.entries(tags).filter(([, value]) => value !== undefined).map(([tag, value]) => `[${tag} "${value}"]`),
    comment && `{${comment}}`,
].filter(Boolean).join('\n')

const MATCH_TAGS = {
    Round: '1', Room: 'Closed', HomeTeam: 'Nasi', VisitTeam: 'Rywale',
    North: 'Bartosz Bańkowski', South: 'Marek Jarosz', West: 'Ewa E', East: 'Fryderyk F',
    OtherNorth: 'Celina C', OtherSouth: 'Dorota D', OtherWest: 'Anna A', OtherEast: 'Beata B',
}

test('finds our team by our pair: here NS, so the home team', () => {
    const {deals} = parsePbn([deal(MATCH_TAGS, 'WYNIK: +3'), deal(MATCH_TAGS, 'WYNIK: -1')].join('\n\n'))

    const {team, matches: [match]} = matchSummary(deals)

    expect(team).toBe('Nasi')
    expect(match).toMatchObject({opponent: 'Rywale', imps: [3, 1]})
    expect(match.segments[0].ourTable).toMatchObject({room: 'zamknięty', ours: 'ns'})
    expect(match.segments[0].otherTable).toEqual({room: 'otwarty', ns: ['Celina C', 'Dorota D'], ew: ['Anna A', 'Beata B'], ours: 'ew'})
})

test.each(['Round', 'Room', 'HomeTeam', 'OtherEast'])('is null when a deal has no [%s] tag', tag => {
    const {deals} = parsePbn([deal(MATCH_TAGS), deal({...MATCH_TAGS, [tag]: undefined})].join('\n\n'))

    expect(matchSummary(deals)).toBeNull()
})

test('is null for a pairs tournament', () => {
    expect(matchSummary(parsePbn(deal({Board: '1', North: 'Bartosz Bańkowski', South: 'Marek Jarosz'})).deals)).toBeNull()
    expect(matchSummary([])).toBeNull()
})
