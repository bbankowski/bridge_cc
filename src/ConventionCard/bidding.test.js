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
            {type: 'bid', sequence: '1T-1K', description: 'negat', level: 1},
            {type: 'table', sequence: '1T-1K', section: null, description: 'negat'},
            {type: 'bid', sequence: '1T-1K-1BA', description: '18-20 PC', level: 1},
            {type: 'section', title: 'Po polskim treflu'},
            {type: 'table', sequence: '1T', section: '^', description: undefined},
            {type: 'bid', sequence: '1T-X', description: 'wywolawcza', level: 1},
        ])
    })

    test('parses bidding.txt', () => {
        const entries = parseBidding(fs.readFileSync(path.join(import.meta.dirname, '../../bidding.txt'), 'utf8'))

        const openings = entries.filter(entry => entry.type === 'opening').map(entry => entry.sequence)
        expect(openings).toContain('1T')
        expect(openings.every(opening => !opening.startsWith('T'))).toBe(true)
    })
})

describe('tableRows', () => {
    test('adds opponent passes after our own opening', () => {
        expect(tableRows('1T-1K', null)).toEqual([['1T', 'pas', '1K', 'pas'], ['?', 'pas', '', '']])
    })

    test('does not add passes in sections', () => {
        expect(tableRows('1T-X', '^')).toEqual([['1T', 'X', '?', '']])
    })
})
