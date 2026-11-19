import fs from 'node:fs'
import path from 'node:path'
import {describe, expect, test} from 'vitest'
import {parsePbn, serializePbn} from './pbn'

const publicDir = path.join(import.meta.dirname, '../../public')
const pbnFiles = fs.readdirSync(publicDir).filter(file => file.endsWith('.pbn'))
const readPbn = filename => fs.readFileSync(path.join(publicDir, filename), 'utf8')

const normalize = text => text.split(/\r?\n/).map(line => line.trimEnd()).filter(line => line !== '').join('\n')

const DEAL = `[Event "Test"]
[Board "5"]
[Dealer "E"]
[Vulnerable "NS"]
[Deal "N:AK.QJ.T9.8765 Q.K.A.J E2.3.4.5 6.7.8.9"]
[Contract "4HX"]
{Wist w \\S8}
[Minimax "4SDW100"]
[Auction "E"]
1H =1= $6 Pass 2H X
AP
[Note "1: naturalne"]
[OptimumResultTable "Declarer;Denomination\\2R;Result\\2R"]
N  C 10
N NT  6
`

describe('parsePbn', () => {
    test('parses a deal', () => {
        const {deals: [deal]} = parsePbn(DEAL)

        expect(deal).toMatchObject({
            event: 'Test',
            board: '5',
            contract: '4HX',
            dealer: 'E',
            vulnerable: ['N', 'S'],
            hands: {N: ['AK', 'QJ', 'T9', '8765'], E: ['Q', 'K', 'A', 'J'], S: ['E2', '3', '4', '5'], W: ['6', '7', '8', '9']},
            notes: ['1: naturalne'],
            minimax: {contract: '4SX', declarer: 'W', score: '100'},
            optimumResults: {N: {C: '10', NT: '6'}, E: {}, S: {}, W: {}},
            commentText: 'Wist w \\S8',
        })
    })

    test('lays the auction out in N/E/S/W columns, skips NAGs and expands AP', () => {
        const {deals: [deal]} = parsePbn(DEAL)

        expect(deal.auction).toEqual([
            [null, ['1H', '1'], ['pas'], ['2H']],
            [['X'], ['pas'], ['pas'], ['pas']],
        ])
    })

    test('does not add passes when the auction has no AP', () => {
        const {deals: [deal]} = parsePbn('[Event "x"]\n[Auction "N"]\n1C Pass Pass Pass\n')

        expect(deal.auction).toEqual([[['1C'], ['pas'], ['pas'], ['pas']]])
    })

    test('reads a multi-line comment', () => {
        const {deals: [deal]} = parsePbn('[Event "x"]\n{first\n\nlast}\n[Board "1"]\n')

        expect(deal.commentText).toEqual('first\n\nlast')
    })
})

describe('serializePbn', () => {
    test.each(pbnFiles)('round-trips %s', filename => {
        const {headers, deals} = parsePbn(readPbn(filename))

        expect(deals.length).toBeGreaterThan(0)
        expect(normalize(serializePbn(headers, deals))).toEqual(normalize(readPbn(filename)))
    })

    test('writes the edited comment back', () => {
        const {headers, deals} = parsePbn(readPbn(pbnFiles[0]))
        const edited = deals.map((deal, index) => index === 0 ? {...deal, commentText: 'edited\ncomment'} : deal)

        const reloaded = parsePbn(serializePbn(headers, edited))

        expect(reloaded.headers).toEqual(headers)
        expect(reloaded.deals).toHaveLength(deals.length)
        expect(reloaded.deals[0].commentText).toEqual('edited\ncomment')
    })

    test('adds a comment after [Result] when the deal had none', () => {
        const {headers, deals} = parsePbn('[Event "x"]\n[Result "9"]\n[Score "NS 140"]\n')

        const serialized = serializePbn(headers, [{...deals[0], commentText: 'new'}])

        expect(serialized).toEqual('[Event "x"]\n[Result "9"]\n{new}\n[Score "NS 140"]\n')
    })
})
