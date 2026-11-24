import fs from 'node:fs'
import path from 'node:path'
import {describe, expect, test} from 'vitest'
import {parseAbility, parsePbn, serializePbn, updateDeal} from './pbn'

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

describe('the [Ability] tag', () => {
    test('gives the double dummy tricks of each declarer, in hexadecimal digits', () => {
        expect(parseAbility('N:9DC57 E:10176 S:9DB57 W:10176')).toEqual({
            N: {NT: '9', S: '13', H: '12', D: '5', C: '7'},
            E: {NT: '1', S: '0', H: '1', D: '7', C: '6'},
            S: {NT: '9', S: '13', H: '11', D: '5', C: '7'},
            W: {NT: '1', S: '0', H: '1', D: '7', C: '6'},
        })
    })

    test.each([undefined, '', 'N:66745 E:76598', 'N:6674 E:76598 S:66745 W:76598'])('ignores %j', ability => {
        expect(parseAbility(ability)).toBeNull()
    })

    test('fills the table of tricks of the deals that have no [OptimumResultTable]', () => {
        const [deal] = parsePbn(fs.readFileSync(path.join(import.meta.dirname, 'fixtures/team-match.pbn'), 'utf8')).deals

        // board 1 of round 5 of the III league: the double dummy analysis of the MZBS results
        expect(deal.optimumResults.N).toEqual({NT: '6', S: '6', H: '7', D: '4', C: '5'})
        expect(deal.optimumResults.W).toEqual({NT: '7', S: '6', H: '5', D: '9', C: '8'})
    })

    test('prefers the [OptimumResultTable] of BridgeComposer', () => {
        const [deal] = parsePbn('[Ability "N:00000 E:00000 S:00000 W:00000"]\n[OptimumResultTable "Declarer;Denomination\\\\2R;Result\\\\2R"]\nN  C 10').deals

        expect(deal.optimumResults.N.C).toBe('10')
    })
})

describe('updateDeal', () => {
    const DEAL = `[Event "Mecz"]
[Board "1"]
[Dealer "N"]
[Vulnerable "None"]
[Deal "N:AK.QJ.T9.8765 Q.K.A.J 2.3.4.5 6.7.8.9"]
[Declarer "S"]
[Contract "3H"]
[Result "7"]
[Score "NS -100"]
{Nasz stół: 3\\H S -2}
[Ability "N:66745 E:76598 S:66745 W:76598"]
[Minimax "3DW-110"]
[Play "W"]
CK`
    const [deal] = parsePbn(DEAL).deals
    const lines = edited => serializePbn([], [edited]).trim().split('\n')

    test('adds an auction before the play and keeps everything else', () => {
        const edited = updateDeal(deal, {auctionLines: ['[Auction "N"]', '1C =1= Pass 1H Pass', '[Note "1:16+"]']})

        expect(lines(edited)).toEqual([...DEAL.split('\n').slice(0, -2),
            '[Auction "N"]', '1C =1= Pass 1H Pass', '[Note "1:16+"]', '[Play "W"]', 'CK'])
        expect(edited.auction).toEqual([[['1C', '1'], ['pas'], ['1H'], ['pas']]])
        expect(edited.notes).toEqual(['1:16+'])
        expect(edited.commentText).toBe('Nasz stół: 3\\H S -2')
    })

    test('replaces an auction with its notes', () => {
        const withAuction = updateDeal(deal, {auctionLines: ['[Auction "N"]', '1C =1= Pass', '1H AP', '[Note "1:16+"]']})

        const edited = updateDeal(withAuction, {auctionLines: ['[Auction "N"]', '1NT Pass 3NT AP']})

        expect(lines(edited).filter(line => /Auction|Note|NT|1C/.test(line))).toEqual(['[Auction "N"]', '1NT Pass 3NT AP'])
        expect(edited.notes).toEqual([])
    })

    test('removes the auction when it was cleared', () => {
        const withAuction = updateDeal(deal, {auctionLines: ['[Auction "N"]', 'Pass Pass Pass Pass']})

        expect(lines(updateDeal(withAuction, {auctionLines: []}))).toEqual(DEAL.split('\n'))
    })

    test('changes the result tags in place and keeps the comment where it was', () => {
        const edited = updateDeal(deal, {contract: '4SX', declarer: 'W', result: '8', score: 'EW -300', commentText: 'nowy'})

        expect(lines(edited).slice(5, 10)).toEqual(
            ['[Declarer "W"]', '[Contract "4SX"]', '[Result "8"]', '[Score "EW -300"]', '{nowy}'])
        expect(edited).toMatchObject({contract: '4SX', declarer: 'W', result: '8', score: 'EW -300'})
    })

    test('adds missing result tags', () => {
        const [bare] = parsePbn('[Board "2"]\n[Dealer "E"]\n[Deal "N:AK.QJ.T9.8765 Q.K.A.J 2.3.4.5 6.7.8.9"]').deals

        const edited = updateDeal(bare, {contract: 'Pass', declarer: '', result: '', score: 'NS 0',
            auctionLines: ['[Auction "E"]', 'Pass Pass Pass Pass']})

        expect(lines(edited)).toEqual(['[Board "2"]', '[Dealer "E"]', '[Deal "N:AK.QJ.T9.8765 Q.K.A.J 2.3.4.5 6.7.8.9"]',
            '[Declarer ""]', '[Contract "Pass"]', '[Result ""]', '[Score "NS 0"]', '[Auction "E"]', 'Pass Pass Pass Pass'])
    })
})
