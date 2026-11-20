import fs from 'node:fs'
import path from 'node:path'
import {describe, expect, test} from 'vitest'
import {buildChapters, entryMatches, parseBidding, searchItems, slugify, tableRows} from './bidding'

const strip = entries => entries.map(entry => {
    const copy = {...entry}
    delete copy.index
    return copy
})

const readBiddingTxt = () => fs.readFileSync(path.join(import.meta.dirname, '../../bidding.txt'), 'utf8')

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
* Po otwarciu 1BA
T1BA-2C
1BA-2C-X    => negatywna
^ Po klasycznym BA
1BA-2C      => kolor 5+
`)

        const tables = entries.filter(entry => entry.type === 'table').map(entry => entry.id)
        const targets = entries.filter(entry => entry.type === 'bid').map(entry => [entry.sequence, entry.target])
        expect(tables).toEqual(['bid-1BA-2C', 'bid-po-otwarciu-1ba-1BA-2C'])
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

    test.each([
        ['Blackwood 102 i kolorowe króle/damy', 'kolejny szczebel oprócz koloru uzgodnionego'],
        ['Po slabych otwarciach 2C/2P i 2K', '2C/2P monokolor lub dwukolorowki, 2K w znaczeniu monokolor karowy'],
    ])('the section "%s" of bidding.txt has a short title and a description', (title, description) => {
        const section = parseBidding(readBiddingTxt()).find(entry => entry.type === 'section' && entry.title === title)

        expect(section.description).toBe(description)
    })

    test('finds openings by their short description too', () => {
        expect(entryMatches({sequence: '3T', short: 'blok', description: 'po partii kolor 7+'}, 'blok')).toBe(true)
    })

    test('the 4NT opening of bidding.txt asks for specific aces', () => {
        const entries = parseBidding(readBiddingTxt())
        const opening = entries.find(entry => entry.type === 'opening' && entry.sequence === '4BA')

        expect(opening.description).toMatch(/pytanie o asy/)
        const responses = entries.filter(entry => entry.type === 'bid' && entry.scope === '' && entry.sequence.startsWith('4BA-'))
        expect(Object.fromEntries(responses.map(entry => [entry.sequence, entry.description]))).toEqual({
            '4BA-5T': 'bez asa',
            '4BA-5K': 'as karo',
            '4BA-5C': 'as kier',
            '4BA-5P': 'as pik',
            '4BA-6T': 'as trefl',
            '4BA-5BA': 'dwa asy',
        })
        // the Blackwood responses of the "Konwencje" chapter stay separate
        expect(entries.find(entry => entry.sequence === '4BA-5T' && entry.scope !== '').description).toBe('1 lub 4 wartosci')
    })

    test('parses bidding.txt', () => {
        const entries = parseBidding(readBiddingTxt())

        const openings = entries.filter(entry => entry.type === 'opening').map(entry => entry.sequence)
        expect(openings).toContain('1T')
        expect(openings.every(opening => !opening.startsWith('T'))).toBe(true)
        const ids = entries.filter(entry => entry.id).map(entry => entry.id)
        expect(new Set(ids).size).toBe(ids.length)
        expect(entries.filter(entry => entry.type === 'chapter').map(entry => entry.title))
            .toEqual(['Nasze otwarcia', 'Po interwencji przeciwników', 'W obronie', 'Konwencje'])
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

    test('puts every section of bidding.txt in a chapter', () => {
        const chapters = buildChapters(parseBidding(readBiddingTxt()))

        expect(chapters.map(chapter => chapter.title)).not.toContain(null)
        const konwencje = chapters.find(chapter => chapter.title === 'Konwencje')
        expect(konwencje.items.map(item => item.entry.title)).toContain('Po blackwoodzie')
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
