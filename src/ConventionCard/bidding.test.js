import fs from 'node:fs'
import path from 'node:path'
import {describe, expect, test} from 'vitest'
import {parseBidding, tableRows} from './bidding'

describe('parseBidding', () => {
    test('parses openings, continuations, tables and sections', () => {
        const entries = parseBidding(`# comment
1T          => 12-14 PC

1T-1K       => negat
T1T-1K
1T-1K-1BA   => 18-20 PC
^ Po polskim treflu
T1T
1T-X        => wywolawcza
`)

        expect(entries).toEqual([
            {type: 'opening', sequence: '1T', description: '12-14 PC'},
            {type: 'bid', sequence: '1T-1K', description: 'negat', level: 1, sectionIndex: 0, target: 'bid-1T-1K'},
            {type: 'table', id: 'bid-1T-1K', sequence: '1T-1K', section: null, sectionIndex: 0, description: 'negat'},
            {type: 'bid', sequence: '1T-1K-1BA', description: '18-20 PC', level: 1, sectionIndex: 0, target: undefined},
            {type: 'section', title: 'Po polskim treflu'},
            {type: 'table', id: 'bid-s1-1T', sequence: '1T', section: '^', sectionIndex: 1, description: undefined},
            {type: 'bid', sequence: '1T-X', description: 'wywolawcza', level: 1, sectionIndex: 1, target: undefined},
        ])
    })

    // https://github.com/bbankowski/bridge_cc/issues/12
    test('links a sequence only to a table in its own section', () => {
        const entries = parseBidding(`1BA => 15-17
1BA-2C      => transfer na piki
T1BA-2C
1BA-2C-2P   => przyjecie transferu
* Po otwarciu 1BA
T1BA-2C
1BA-2C-X    => negatywna
^ Po klasycznym BA
1BA-2C      => kolor 5+
`)

        const tables = entries.filter(entry => entry.type === 'table').map(entry => entry.id)
        const targets = entries.filter(entry => entry.type === 'bid').map(entry => [entry.sequence, entry.target])
        expect(tables).toEqual(['bid-1BA-2C', 'bid-s1-1BA-2C'])
        expect(targets).toEqual([
            ['1BA-2C', 'bid-1BA-2C'],
            ['1BA-2C-2P', undefined],
            ['1BA-2C-X', undefined],
            ['1BA-2C', undefined],
        ])
    })

    test('gives repeated tables in one section unique ids and links to the next one', () => {
        const entries = parseBidding(`* Po interwencji
1T-2K       => naturalne
T1T-2K
1T-2K-X     => wywolawcza
T1T-2K
1T-2K       => multi
`)

        expect(entries.filter(entry => entry.type === 'table').map(entry => entry.id))
            .toEqual(['bid-s1-1T-2K', 'bid-s1-1T-2K-2'])
        expect(entries.filter(entry => entry.sequence === '1T-2K' && entry.type === 'bid').map(entry => entry.target))
            .toEqual(['bid-s1-1T-2K', 'bid-s1-1T-2K-2'])
    })

    test('parses bidding.txt', () => {
        const entries = parseBidding(fs.readFileSync(path.join(import.meta.dirname, '../../bidding.txt'), 'utf8'))

        const openings = entries.filter(entry => entry.type === 'opening').map(entry => entry.sequence)
        expect(openings).toContain('1T')
        expect(openings.every(opening => !opening.startsWith('T'))).toBe(true)
        const ids = entries.filter(entry => entry.type === 'table').map(entry => entry.id)
        expect(new Set(ids).size).toBe(ids.length)
    })
})

describe('tableRows', () => {
    test('adds opponent passes after our own opening', () => {
        expect(tableRows('1T-1K', null)).toEqual([['1T', 'pas', '1K', 'pas'], ['?', '', '', '']])
    })

    // the reported case: 1♣ (pas) 1♦ (pas) 2BA (pas) ? -- no pass after "?", it is our turn
    test('ends with our turn, without a pass after it', () => {
        expect(tableRows('1T-1K-2BA', null)).toEqual([['1T', 'pas', '1K', 'pas'], ['2BA', 'pas', '?', '']])
    })

    test('does not add passes in sections', () => {
        expect(tableRows('1T-X', '^')).toEqual([['1T', 'X', '?', '']])
    })
})
