import {describe, expect, test} from 'vitest'
import {buildChapters, entryMatches, parseBidding, plainSequence, searchItems, sequenceCalls, slugify, tableRows} from './bidding'

const strip = entries => entries.map(entry => {
    const copy = {...entry}
    delete copy.index
    return copy
})

describe('parseBidding', () => {
    test('parses chapters, openings, continuations, tables and sections', () => {
        const entries = parseBidding(`# comment
@ Nasze otwarcia
1T          => 12-14 PC

1T-1K       => negat
T1T-1K
1T-1K-1BA   => 18-20 PC
@ W obronie
^ Po polskim treflu
T1T
1T-X        => wywolawcza
`)

        expect(strip(entries)).toEqual([
            {type: 'chapter', id: 'chapter-nasze-otwarcia', title: 'Nasze otwarcia'},
            {type: 'opening', id: 'opening-1T', sequence: '1T', description: '12-14 PC'},
            {type: 'bid', sequence: '1T-1K', description: 'negat', level: 1, scope: '', section: null, target: 'bid-1T-1K'},
            {type: 'table', id: 'bid-1T-1K', sequence: '1T-1K', section: null, scope: '', description: 'negat'},
            {type: 'bid', sequence: '1T-1K-1BA', description: '18-20 PC', level: 1, scope: '', section: null, target: undefined},
            {type: 'chapter', id: 'chapter-w-obronie', title: 'W obronie'},
            {type: 'section', id: 'po-polskim-treflu', title: 'Po polskim treflu'},
            {
                type: 'table', id: 'bid-po-polskim-treflu-1T', sequence: '1T', section: '^',
                scope: 'po-polskim-treflu', description: undefined,
            },
            {
                type: 'bid', sequence: '1T-X', description: 'wywolawcza', level: 1, scope: 'po-polskim-treflu',
                section: '^', target: undefined,
            },
        ])
        expect(entries.map(entry => entry.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    })

    // https://github.com/bbankowski/bridge_cc/issues/12
    test('links a sequence only to a table in its own section', () => {
        const entries = parseBidding(`1BA => 15-17
1BA-2C      => transfer na piki
T1BA-2C
1BA-2C-2P   => przyjecie transferu
* Po interwencji na 1BA
T1BA-2C
1BA-2C-X    => negatywna
^ Po klasycznym BA
1BA-2C      => kolor 5+
`)

        const tables = entries.filter(entry => entry.type === 'table').map(entry => entry.id)
        const targets = entries.filter(entry => entry.type === 'bid').map(entry => [entry.sequence, entry.target])
        expect(tables).toEqual(['bid-1BA-2C', 'bid-po-interwencji-na-1ba-1BA-2C'])
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
            .toEqual(['bid-po-interwencji-1T-2K', 'bid-po-interwencji-1T-2K-2'])
        expect(entries.filter(entry => entry.sequence === '1T-2K' && entry.type === 'bid').map(entry => entry.target))
            .toEqual(['bid-po-interwencji-1T-2K', 'bid-po-interwencji-1T-2K-2'])
    })

    test('scopes tables outside sections of later chapters to the chapter', () => {
        const entries = parseBidding(`@ Pierwszy
T1T-1K
@ Drugi
T1T-1K
1T-1K-1C => x
`)

        expect(entries.filter(entry => entry.type === 'table').map(entry => entry.id))
            .toEqual(['bid-1T-1K', 'bid-chapter-drugi-1T-1K'])
    })

    test('splits the description of an opening into "short | full"', () => {
        const [withShort, plain] = parseBidding('3T => blok | po partii kolor 7+\n1P => 12-17 PC, 5+ pików\n')

        expect(withShort).toMatchObject({type: 'opening', short: 'blok', description: 'po partii kolor 7+'})
        expect(plain.description).toBe('12-17 PC, 5+ pików')
        expect(plain).not.toHaveProperty('short')
    })

    test('reads a description of a section after "=>"', () => {
        const [section, plain] = parseBidding('& Blackwood 102 => kolejny szczebel oprócz koloru uzgodnionego\n^ Po silnym treflu\n')

        expect(section).toEqual({type: 'section', id: 'blackwood-102', title: 'Blackwood 102',
            description: 'kolejny szczebel oprócz koloru uzgodnionego', index: 0})
        expect(plain).not.toHaveProperty('description')
    })

    test('finds openings by their short description too', () => {
        expect(entryMatches({sequence: '3T', short: 'blok', description: 'po partii kolor 7+'}, 'blok')).toBe(true)
    })

    test('keeps the answers to an opening apart from the same sequences in a section', () => {
        const entries = parseBidding(`@ Nasze otwarcia
4BA          => pytanie o asy
4BA-5T       => bez asa
@ Konwencje
& Blackwood
T4BA
4BA-5T       => 1 lub 4 wartości
`)

        expect(entries.filter(entry => entry.sequence === '4BA-5T').map(entry => [entry.scope, entry.description]))
            .toEqual([['', 'bez asa'], ['blackwood', '1 lub 4 wartości']])
    })
})

describe('slugify', () => {
    test.each([
        ['Po interwencji na otwarcie 1 trefl', 'po-interwencji-na-otwarcie-1-trefl'],
        ['Blackwood 102 i kolorowe króle/damy', 'blackwood-102-i-kolorowe-krole-damy'],
        ['Po słabym BA (12-14 PC)', 'po-slabym-ba-12-14-pc'],
    ])('%s -> %s', (text, slug) => {
        expect(slugify(text)).toBe(slug)
    })
})

describe('buildChapters', () => {
    test('groups entries into chapters and menu items', () => {
        const chapters = buildChapters(parseBidding(`1T => before chapters
@ Nasze otwarcia
1T          => 12-14 PC
1T-1K       => negat
pas         => brak otwarcia
@ Konwencje
& Blackwood
4BA-5T      => 1 lub 4
`))

        expect(chapters.map(chapter => [chapter.id, chapter.title, chapter.items.map(item => item.id)])).toEqual([
            ['chapter-start', null, ['opening-1T']],
            ['chapter-nasze-otwarcia', 'Nasze otwarcia', ['opening-1T-2', 'opening-pas']],
            ['chapter-konwencje', 'Konwencje', ['blackwood']],
        ])
        expect(chapters[1].items[0].entries.map(entry => entry.sequence)).toEqual(['1T', '1T-1K'])
    })
})

describe('search', () => {
    const chapters = buildChapters(parseBidding(`@ Nasze otwarcia
1BA         => 15-17 PC
1BA-2K      => transfer na kiery
1BA-2C      => transfer na piki
@ W obronie
^ Po słabym BA
1BA-2C      => kolor 5+
`))

    test.each([
        ['transfer', true],
        ['TRANSFER kiery', true],
        ['1BA-2K', true],
        ['transfer pik', false],
        ['', false],
    ])('entryMatches(1BA-2K transfer na kiery, %j) is %s', (query, expected) => {
        expect(entryMatches({sequence: '1BA-2K', description: 'transfer na kiery'}, query)).toBe(expected)
    })

    test('ignores Polish diacritics', () => {
        expect(entryMatches({title: 'Po słabym BA'}, 'slabym')).toBe(true)
    })

    test('counts matches per menu item and finds the first one', () => {
        const results = searchItems(chapters, 'transfer')

        expect([...results.keys()]).toEqual(['opening-1BA'])
        expect(results.get('opening-1BA').count).toBe(2)
        expect(results.get('opening-1BA').first.sequence).toBe('1BA-2K')
    })

    test('finds sequences in several chapters', () => {
        expect([...searchItems(chapters, '1BA-2C').keys()]).toEqual(['opening-1BA', 'po-slabym-ba'])
    })
})

describe('tableRows', () => {
    // calls as shown: the opponents' in parentheses
    const shown = sequence => tableRows(sequence).map(row => row.map(({call, theirs}) => theirs ? `(${call})` : call))

    test('adds opponent passes to an uncontested sequence', () => {
        expect(shown('1T-1K')).toEqual([['1T', '(pas)', '1K', '(pas)'], ['?', '', '', '']])
        expect(tableRows('1T-1K')[0][1]).toEqual({call: 'pas', theirs: true, implicit: true})
    })

    // the reported case: 1♣ (pas) 1♦ (pas) 2BA (pas) ? -- no pass after "?", it is our turn
    test('ends with our turn, without a pass after it', () => {
        expect(shown('1T-1K-2BA')).toEqual([['1T', '(pas)', '1K', '(pas)'], ['2BA', '(pas)', '?', '']])
    })

    test('takes the calls of the opponents from the parentheses, without adding passes', () => {
        expect(shown('(1T)-2T-(X)-XX')).toEqual([['(1T)', '2T', '(X)', 'XX'], ['?', '', '', '']])
        expect(shown('1BA-(pas)-2T-(X)')).toEqual([['1BA', '(pas)', '2T', '(X)'], ['?', '', '', '']])
    })
})

describe('sequences with the calls of the opponents', () => {
    test('sequenceCalls and plainSequence', () => {
        expect(sequenceCalls('(1T)-2T-(X)')).toEqual([{call: '1T', theirs: true}, {call: '2T', theirs: false},
            {call: 'X', theirs: true}])
        expect(plainSequence('(1T)-2T-(X)')).toBe('1T-2T-X')
    })

    test('keep the ids and links without the parentheses', () => {
        const entries = parseBidding('@ W obronie\n^ Po polskim treflu\nT(1T)-2T-(X)\n(1T)-2T-(X)-XX => pokaż lepszy kolor\n')
        const [table, bid] = entries.filter(entry => entry.type === 'table' || entry.type === 'bid')

        expect(table).toMatchObject({id: 'bid-po-polskim-treflu-1T-2T-X', sequence: '(1T)-2T-(X)'})
        expect(bid).toMatchObject({sequence: '(1T)-2T-(X)-XX', level: 1})
    })

    test('are found when searched without the parentheses', () => {
        expect(entryMatches({sequence: '(1T)-2T-(X)-XX', description: 'pokaż'}, '1T-2T-X-XX')).toBe(true)
    })
})
