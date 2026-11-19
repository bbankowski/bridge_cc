const countDashes = sequence => (sequence.match(/-/g) || []).length

const SECTION_MARKERS = ['^', '&', '*']

/*
 * Parses bidding.txt. Each line is "<sequence> => <description>"; lines starting with "#" are comments.
 * - "^ title", "& title", "* title" start a new section ("*": we open, "^": the opponents open),
 * - "T<sequence>" draws an auction table for the sequence,
 * - a single call (e.g. "1T", "2BA", "pas") is an opening,
 * - everything else is a continuation, indented relative to the last table.
 *
 * The same sequence means different things in different sections (e.g. "1BA-2C" is a transfer after our 1NT,
 * but an overcall after the opponents' 1NT), so tables get ids unique per section and a continuation links only
 * to a table of its own section.
 */
export const parseBidding = text => {
    const entries = []
    let section = null
    let sectionIndex = 0
    let tableLevel = 0
    const usedIds = new Set()

    const tableId = sequence => {
        // tables before the first section keep the plain "bid-<sequence>" ids used by existing links
        const base = sectionIndex === 0 ? `bid-${sequence}` : `bid-s${sectionIndex}-${sequence}`
        let id = base
        for (let n = 2; usedIds.has(id); n++) {
            id = `${base}-${n}`
        }
        usedIds.add(id)
        return id
    }

    for (const line of text.split(/\r?\n/)) {
        if (line.trim() === '' || line.startsWith('#')) {
            continue
        }
        const [bidPart, descriptionPart] = line.split('=>')
        const bid = bidPart.trim()
        const description = (descriptionPart ?? '').trim()

        if (SECTION_MARKERS.includes(bid[0])) {
            section = bid[0]
            sectionIndex++
            entries.push({type: 'section', title: bid.slice(1).trim()})
        } else if (bid.startsWith('T')) {
            const sequence = bid.substring(1)
            tableLevel = countDashes(sequence)
            const described = section === null
                ? entries.findLast(entry => entry.type !== 'table' && entry.sequence === sequence)
                : undefined
            entries.push({
                type: 'table', id: tableId(sequence), sequence, section, sectionIndex,
                description: described?.description,
            })
        } else if (!bid.includes('-')) {
            entries.push({type: 'opening', sequence: bid, description})
        } else {
            entries.push({
                type: 'bid', sequence: bid, description, sectionIndex,
                level: Math.max(countDashes(bid) - tableLevel, 0),
            })
        }
    }

    // a continuation links to the table of its sequence in the same section: the next one, or else the last before it
    entries.forEach((entry, index) => {
        if (entry.type !== 'bid') {
            return
        }
        const tables = entries.filter(other => other.type === 'table' && other.sectionIndex === entry.sectionIndex
            && other.sequence === entry.sequence)
        const target = tables.find(table => entries.indexOf(table) > index) ?? tables.at(-1)
        entry.target = target?.id
    })
    return entries
}

// Lays out the auction of a table in rows of 4, ending with "?" (our turn). Outside any section the opponents pass
// after each of our calls.
export const tableRows = (sequence, section) => {
    let calls = sequence.split('-')
    if (section === null) {
        calls = calls.flatMap(call => [call, 'pas'])
    }
    calls.push('?')
    while (calls.length % 4 !== 0) {
        calls.push('')
    }
    const rows = []
    for (let i = 0; i < calls.length; i += 4) {
        rows.push(calls.slice(i, i + 4))
    }
    return rows
}
