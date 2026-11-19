const countDashes = sequence => (sequence.match(/-/g) || []).length

const SECTION_MARKERS = ['^', '&', '*']

/*
 * Parses bidding.txt. Each line is "<sequence> => <description>"; lines starting with "#" are comments.
 * - "^ title", "& title", "* title" start a new section ("*": we open, "^": the opponents open),
 * - "T<sequence>" draws an auction table for the sequence,
 * - a single call (e.g. "1T", "2BA", "pas") is an opening,
 * - everything else is a continuation, indented relative to the last table.
 */
export const parseBidding = text => {
    const entries = []
    let section = null
    let tableLevel = 0

    for (const line of text.split(/\r?\n/)) {
        if (line.trim() === '' || line.startsWith('#')) {
            continue
        }
        const [bidPart, descriptionPart] = line.split('=>')
        const bid = bidPart.trim()
        const description = (descriptionPart ?? '').trim()

        if (SECTION_MARKERS.includes(bid[0])) {
            section = bid[0]
            entries.push({type: 'section', title: bid.slice(1).trim()})
        } else if (bid.startsWith('T')) {
            const sequence = bid.substring(1)
            tableLevel = countDashes(sequence)
            const described = section === null
                ? entries.findLast(entry => entry.type !== 'table' && entry.sequence === sequence)
                : undefined
            entries.push({type: 'table', sequence, section, description: described?.description})
        } else if (!bid.includes('-')) {
            entries.push({type: 'opening', sequence: bid, description})
        } else {
            entries.push({type: 'bid', sequence: bid, description, level: Math.max(countDashes(bid) - tableLevel, 0)})
        }
    }
    return entries
}

// Lays out the auction of a table in rows of 4, ending with "?". Outside any section the opponents pass.
export const tableRows = (sequence, section) => {
    let calls = [...sequence.split('-'), '?']
    if (section === null) {
        calls = calls.flatMap(call => [call, 'pas'])
    }
    while (calls.length % 4 !== 0) {
        calls.push('')
    }
    const rows = []
    for (let i = 0; i < calls.length; i += 4) {
        rows.push(calls.slice(i, i + 4))
    }
    return rows
}
