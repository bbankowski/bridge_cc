import fs from 'fs'
import path from 'path'
import {loadPbn, serializePbn} from './PbnLoader'

const publicDir = path.join(__dirname, '../../public')
const pbnFiles = fs.readdirSync(publicDir).filter(file => file.endsWith('.pbn'))

const normalize = text => text.split(/\r?\n/).map(line => line.trimEnd()).filter(line => line !== '').join('\n')

beforeEach(() => {
    global.fetch = filename => Promise.resolve({
        text: () => Promise.resolve(fs.readFileSync(path.join(publicDir, filename), 'utf8')),
    })
})

test.each(pbnFiles)('serializePbn round-trips %s', async filename => {
    const [headers, deals] = await loadPbn(filename)

    const serialized = serializePbn(headers, deals)

    expect(deals.length).toBeGreaterThan(0)
    expect(normalize(serialized)).toEqual(normalize(fs.readFileSync(path.join(publicDir, filename), 'utf8')))
})

test('serializePbn writes the edited comment', async () => {
    const [headers, deals] = await loadPbn(pbnFiles[0])
    deals[0]['commentText'] = 'edited comment'

    const [reloadedHeaders, reloadedDeals] = await (async () => {
        global.fetch = () => Promise.resolve({text: () => Promise.resolve(serializePbn(headers, deals))})
        return loadPbn('edited.pbn')
    })()

    expect(reloadedHeaders).toEqual(headers)
    expect(reloadedDeals[0]['commentText']).toEqual('edited comment')
    expect(reloadedDeals.length).toEqual(deals.length)
})

test('loadPbn skips NAG annotations in the auction', async () => {
    const [, deals] = await loadPbn('3liga_2025-2026_3zjazd.pbn')

    const bids = deals.flatMap(deal => deal['chunkedAuction'].flat().flat())

    expect(bids.some(bid => typeof bid === 'string' && bid.startsWith('$'))).toBe(false)
})
