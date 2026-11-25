const countDashes = sequence => (sequence.match(/-/g) || []).length

/*
 * Calls of a sequence: "(1T)-2T-(X)" -> [{call: '1T', theirs: true}, {call: '2T', theirs: false}, …].
 * The calls of the opponents are in parentheses. A sequence without any is an uncontested auction of our side.
 */
export const sequenceCalls = sequence => sequence.split('-').map(call => {
    const theirs = call.startsWith('(') && call.endsWith(')')
    return {call: theirs ? call.slice(1, -1) : call, theirs}
})

// "(1T)-2T-(X)" -> "1T-2T-X": used for ids, links and search, so they do not depend on the parentheses
export const plainSequence = sequence => sequence.replace(/[()]/g, '')

export const isContested = sequence => sequence.includes('(')

const SECTION_MARKERS = ['^', '&', '*']
const CHAPTER_MARKER = '@'

// "Po interwencji na otwarcie 1 trefl" -> "po-interwencji-na-otwarcie-1-trefl"
export const slugify = text => text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replaceAll('ł', 'l').replaceAll('Ł', 'L')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/*
 * Parses bidding.txt. Each line is "<sequence> => <description>"; lines starting with "#" are comments.
 * - "@ title" starts a chapter of the card (an entry of the menu),
 * - "^ title", "& title", "* title" start a new section ("*": we open, "^": the opponents open, "&": a convention);
 *   "& title => description" adds a description shown under the heading,
 * - "T<sequence>" draws an auction table for the sequence,
 * - the calls of the opponents are in parentheses ("(1T)-2T-(X)-XX"); a sequence without them is uncontested
 *   (the opponents pass, which is not written),
 * - a single call (e.g. "1T", "2BA", "pas") is an opening; its description may be "short | full",
 * - everything else is a continuation, indented relative to the last table.
 *
 * The same sequence means different things in different sections (e.g. "1BA-2C" is a transfer after our 1NT,
 * but an overcall after the opponents' 1NT), so tables get ids unique per section and a continuation links only
 * to a table of its own section.
 */
export const parseBidding = text => {
    const entries = []
    const usedIds = new Set()
    let chapterCount = 0
    let chapterId = null
    let section = null
    let sectionId = null
    let tableLevel = 0

    const uniqueId = base => {
        let id = base
        for (let n = 2; usedIds.has(id); n++) {
            id = `${base}-${n}`
        }
        usedIds.add(id)
        return id
    }

    // tables of the first chapter outside sections keep the plain "bid-<sequence>" ids used by existing links
    const scope = () => sectionId ?? (chapterCount > 1 ? chapterId : '')

    for (const line of text.split(/\r?\n/)) {
        if (line.trim() === '' || line.startsWith('#')) {
            continue
        }
        const [bidPart, descriptionPart] = line.split('=>')
        const bid = bidPart.trim()
        const description = (descriptionPart ?? '').trim()

        if (bid[0] === CHAPTER_MARKER) {
            const title = bid.slice(1).trim()
            chapterCount++
            chapterId = uniqueId(`chapter-${slugify(title)}`)
            section = null
            sectionId = null
            entries.push({type: 'chapter', id: chapterId, title})
        } else if (SECTION_MARKERS.includes(bid[0])) {
            const title = bid.slice(1).trim()
            section = bid[0]
            sectionId = uniqueId(slugify(title))
            entries.push({type: 'section', id: sectionId, title, ...(description ? {description} : {})})
        } else if (bid.startsWith('T')) {
            const sequence = bid.substring(1)
            const plain = plainSequence(sequence)
            tableLevel = countDashes(sequence)
            const described = section === null
                ? entries.findLast(entry => (entry.type === 'bid' || entry.type === 'opening')
                    && plainSequence(entry.sequence) === plain)
                : undefined
            entries.push({
                type: 'table', id: uniqueId(scope() ? `bid-${scope()}-${plain}` : `bid-${plain}`),
                sequence, section, scope: scope(), description: described?.description,
            })
        } else if (!bid.includes('-')) {
            // "short | full": the short description is shown in the openings overview, the full one in the section
            const [short, full] = description.split(/\s+\|\s+/)
            entries.push({type: 'opening', id: uniqueId(`opening-${bid}`), sequence: bid, description: full ?? short,
                ...(full ? {short} : {})})
        } else {
            entries.push({
                type: 'bid', sequence: bid, description, scope: scope(), section,
                level: Math.max(countDashes(bid) - tableLevel, 0),
            })
        }
    }

    // a continuation links to the table of its sequence in the same section: the next one, or else the last before it
    entries.forEach((entry, index) => {
        entry.index = index
        if (entry.type !== 'bid') {
            return
        }
        const tables = entries.filter(other => other.type === 'table' && other.scope === entry.scope
            && plainSequence(other.sequence) === plainSequence(entry.sequence))
        const target = tables.find(table => entries.indexOf(table) > index) ?? tables.at(-1)
        entry.target = target?.id
    })
    return entries
}

const isTocItem = entry => entry.type === 'opening' || entry.type === 'section'

/*
 * Groups entries into chapters for rendering and the menu:
 * [{id, title, entries, items: [{id, entry, entries}]}], where items are the openings and sections of the chapter
 * with the entries under each of them. Entries before the first "@" line form a chapter without a title.
 */
export const buildChapters = entries => {
    const chapters = []
    let chapter = null
    let item = null
    for (const entry of entries) {
        if (entry.type === 'chapter') {
            chapter = {id: entry.id, title: entry.title, entries: [], items: []}
            chapters.push(chapter)
            item = null
            continue
        }
        if (chapter === null) {
            chapter = {id: 'chapter-start', title: null, entries: [], items: []}
            chapters.push(chapter)
        }
        chapter.entries.push(entry)
        if (isTocItem(entry)) {
            item = {id: entry.id, entry, entries: []}
            chapter.items.push(item)
        }
        item?.entries.push(entry)
    }
    return chapters
}

// Normalizes a search query or a text: lowercase, no diacritics; "1BA-2C" matches sequences as written in the file.
const normalize = text => text.replace(/[()]/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('ł', 'l')
    .replaceAll('Ł', 'L').toLowerCase()

export const entryMatches = (entry, query) => {
    const words = normalize(query).split(/\s+/).filter(Boolean)
    if (words.length === 0) {
        return false
    }
    const text = normalize(`${entry.sequence ?? ''} ${entry.short ?? ''} ${entry.description ?? ''} ${entry.title ?? ''}`)
    return words.every(word => text.includes(word))
}

// Finds the menu items (openings and sections) with entries matching the query:
// Map of item id -> {count, first}, where first is the first matching entry.
export const searchItems = (chapters, query) => {
    const results = new Map()
    for (const chapter of chapters) {
        for (const item of chapter.items) {
            const matches = item.entries.filter(entry => entry.type !== 'table' && entryMatches(entry, query))
            if (matches.length > 0) {
                results.set(item.id, {count: matches.length, first: matches[0]})
            }
        }
    }
    return results
}

/*
 * Lays out the auction of a table in rows of 4 cells {call, theirs, implicit?}, ending with "?" (our turn).
 * In an uncontested sequence the opponents pass after each of our calls (implicit: not written in the sequence).
 */
export const tableRows = sequence => {
    let calls = sequenceCalls(sequence)
    if (!isContested(sequence)) {
        calls = calls.flatMap(call => [call, {call: 'pas', theirs: true, implicit: true}])
    }
    calls.push({call: '?', theirs: false})
    while (calls.length % 4 !== 0) {
        calls.push({call: '', theirs: false})
    }
    const rows = []
    for (let i = 0; i < calls.length; i += 4) {
        rows.push(calls.slice(i, i + 4))
    }
    return rows
}
