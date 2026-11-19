const SEATS = ['N', 'E', 'S', 'W']

const VULNERABILITY = {
    None: [], Love: [], '-': [],
    NS: ['N', 'S'],
    EW: ['E', 'W'],
    Both: SEATS, All: SEATS,
}

const seatsFrom = seat => {
    const start = Math.max(SEATS.indexOf(seat), 0)
    return [...SEATS.slice(start), ...SEATS.slice(0, start)]
}

// "N:AK.QJ.T9.8765 ..." -> {N: ['AK', 'QJ', 'T9', '8765'], E: [...], ...}
const parseHands = deal => {
    if (!deal) {
        return null
    }
    const seats = seatsFrom(deal.charAt(0))
    const hands = {}
    deal.substring(2).split(' ').forEach((hand, index) => {
        hands[seats[index]] = hand.split('.')
    })
    return hands
}

// Returns rows of 4 calls (columns N, E, S, W). Each call is [bid, noteNumber?]; empty cells are null.
const parseAuction = (auctionText, firstSeat) => {
    const calls = Array(Math.max(SEATS.indexOf(firstSeat), 0)).fill(null)
    let allPass = false
    for (const token of auctionText.trim().split(/\s+/)) {
        if (token === '') {
            continue
        } else if (token === 'AP') {
            allPass = true
            break
        } else if (token.startsWith('=')) {
            // note reference for the previous call, e.g. "=1="
            const previous = calls[calls.length - 1]
            if (previous) {
                previous[1] = token.replaceAll('=', '')
            }
        } else if (token.startsWith('$')) {
            // NAG annotation (e.g. "$6"), not a call
        } else {
            calls.push([token === 'Pass' ? 'pas' : token])
        }
    }
    if (allPass) {
        calls.push(['pas'], ['pas'], ['pas'])
    }
    while (calls.length % 4 !== 0) {
        calls.push(null)
    }
    const rows = []
    for (let i = 0; i < calls.length; i += 4) {
        rows.push(calls.slice(i, i + 4))
    }
    return rows
}

// "4SDW100" -> {contract: '4SX', declarer: 'W', score: '100'}
const parseMinimax = minimax => {
    const match = /^([1-7])([CDHSN])([DR]?)([NESW])(-?\d+)$/.exec(minimax || '')
    if (!match) {
        return null
    }
    const [, level, strain, doubled, declarer, score] = match
    return {
        contract: level + (strain === 'N' ? 'NT' : strain) + {'': '', D: 'X', R: 'XX'}[doubled],
        declarer,
        score,
    }
}

const createDeal = (tags, notes, optimumResults, auctionText, comment, rawLines, commentIndex) => ({
    event: tags.Event,
    board: tags.Board,
    contract: tags.Contract,
    declarer: tags.Declarer,
    result: tags.Result,
    score: tags.Score,
    dealer: tags.Dealer,
    vulnerable: VULNERABILITY[tags.Vulnerable] ?? [],
    hands: parseHands(tags.Deal),
    auction: parseAuction(auctionText, tags.Auction || tags.Dealer),
    notes,
    minimax: parseMinimax(tags.Minimax),
    optimumResults,
    commentText: comment,
    // original lines of the deal without its comment, used to write the PBN back
    rawLines,
    commentIndex,
})

export const parsePbn = text => {
    const headers = []
    const deals = []

    let tags = {}
    let notes = []
    let optimumResults = null
    let auctionText = ''
    let comment = ''
    let rawLines = []
    let commentIndex = undefined
    let section = null
    let commentStarted = false

    const finishDeal = () => {
        if (Object.keys(tags).length > 0) {
            deals.push(createDeal(tags, notes, optimumResults, auctionText, comment, rawLines, commentIndex))
        }
        tags = {}
        notes = []
        optimumResults = null
        auctionText = ''
        comment = ''
        rawLines = []
        commentIndex = undefined
        section = null
    }

    for (const line of text.split(/\r?\n/)) {
        if (commentStarted) {
            comment += '\n' + line
            if (line.endsWith('}')) {
                comment = comment.slice(0, -1)
                commentStarted = false
            }
            continue
        }

        if (line.startsWith('%')) {
            headers.push(line)
            continue
        }

        if (line.startsWith('{')) {
            commentIndex = rawLines.length
            if (line.length > 1 && line.endsWith('}')) {
                comment = line.slice(1, -1)
            } else {
                comment = line.substring(1)
                commentStarted = true
            }
            continue
        }

        if (line.startsWith('[Event')) {
            finishDeal()
        }
        rawLines.push(line)

        if (line.startsWith('[')) {
            section = null
            const found = line.match(/\[([A-Za-z]+) "(.*)"]/)
            if (found) {
                const [, tag, value] = found
                tags[tag] = value
                if (tag === 'Note') {
                    notes.push(value)
                } else if (tag === 'Auction') {
                    section = 'auction'
                } else if (tag === 'OptimumResultTable') {
                    section = 'optimumResults'
                    optimumResults = {N: {}, E: {}, S: {}, W: {}}
                }
            }
        } else if (section === 'auction') {
            auctionText += ' ' + line
        } else if (section === 'optimumResults') {
            // e.g. "N NT  6"
            const parts = line.trim().split(/\s+/)
            if (parts.length === 3 && optimumResults[parts[0]]) {
                optimumResults[parts[0]][parts[1]] = parts[2]
            }
        }
    }
    finishDeal()

    return {headers, deals}
}

export const loadPbn = async filename => {
    const response = await fetch(filename)
    if (!response.ok) {
        throw new Error(`Nie udało się pobrać pliku ${filename} (${response.status})`)
    }
    return parsePbn(await response.text())
}

const dealToPbnLines = deal => {
    const lines = [...deal.rawLines]
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.pop()
    }
    if (deal.commentText) {
        let index = deal.commentIndex
        if (index === undefined) {
            const resultIndex = lines.findIndex(line => line.startsWith('[Result '))
            index = resultIndex >= 0 ? resultIndex + 1 : lines.length
        }
        lines.splice(index, 0, `{${deal.commentText}}`)
    }
    return lines
}

export const serializePbn = (headers, deals) =>
    [...headers, ...deals.flatMap(deal => [...dealToPbnLines(deal), ''])].join('\n')
