import {buildChapters, parseBidding, tableRows} from '../ConventionCard/bidding'
import {isLegal, nextSeat, polishCallToPbn, SEATS, withSeats} from './calls'
import {describeHand, formatHand, randomHand, shuffle} from './hands'
import {evaluateOpening} from './openings'

/*
 * A question is plain data (so it can be stored for reviews):
 * {id, mode, category, kind: 'choice' | 'call' | 'card', title, context?, cardAuction?, auction?, hand?, choices?,
 *  answers: [{value, score, comment}], explanation, links: [{label, to}]}
 * - cardAuction: {sequence, section, highlightLast} – an auction from the convention card (polish calls)
 * - auction: {calls: [{seat, call}], firstSeat, seat} – a real auction in PBN notation; seat = who answers
 */

export const MODES = {
    karta: 'Karta konwencyjna',
    otwarcia: 'Otwarcia',
    turnieje: 'Z turniejów',
    wisty: 'Wisty',
}

// ---------- convention card ----------

const callsOf = sequence => sequence.split('-')

const parentOf = sequence => sequence.substring(0, sequence.lastIndexOf('-'))

// Seats and calls of a convention card auction as shown in its table, without the final "?".
const cardAuctionCalls = (sequence, section) => {
    const cells = tableRows(sequence, section).flat()
    return withSeats(cells.slice(0, cells.indexOf('?')), 'N')
}

const isPlayable = (entry) => {
    if (!entry.sequence.includes('-') || !entry.description) {
        return false
    }
    const calls = callsOf(entry.sequence)
    if (calls.some(call => polishCallToPbn(call) === null)) {
        return false
    }
    const section = entry.section ?? null
    const auction = cardAuctionCalls(entry.sequence, section).map(({seat, call}) => ({seat, call: polishCallToPbn(call)}))
    return auction.every((call, index) => isLegal(auction.slice(0, index), call.seat, call.call))
}

const cardLocation = (chapters, entry) => {
    for (const chapter of chapters) {
        for (const item of chapter.items) {
            if (item.entries.includes(entry)) {
                const itemTitle = item.entry.type === 'section' ? item.entry.title
                    : item.entry.sequence === 'pas' ? 'Licytacja po pasie' : `Po otwarciu ${item.entry.sequence}`
                return {chapter, item, label: [chapter.title, itemTitle].filter(Boolean).join(' › ')}
            }
        }
    }
    return {label: ''}
}

export const prepareCard = text => {
    const entries = parseBidding(text)
    const chapters = buildChapters(entries)
    const playable = entries.filter(entry => entry.type === 'bid' && isPlayable(entry))
    return {entries, chapters, playable}
}

const siblingsOf = (card, entry) => card.playable.filter(other => other !== entry && other.scope === entry.scope
    && parentOf(other.sequence) === parentOf(entry.sequence))

const meaningQuestion = (card, entry, random) => {
    const {label, chapter} = cardLocation(card.chapters, entry)
    const distractors = []
    const seen = new Set([entry.description])
    const candidates = [...shuffle(siblingsOf(card, entry), random),
        ...shuffle(card.playable.filter(other => other.scope === entry.scope
            && callsOf(other.sequence).length === callsOf(entry.sequence).length), random)]
    for (const other of candidates) {
        if (distractors.length === 3) {
            break
        }
        if (!seen.has(other.description)) {
            seen.add(other.description)
            distractors.push(other)
        }
    }
    if (distractors.length < 2) {
        return null
    }
    const answers = [
        {value: entry.description, score: 100, comment: 'znaczenie z karty'},
        ...distractors.map(other => ({value: other.description, score: 0, comment: `to znaczenie ${other.sequence}`})),
    ]
    return {
        id: `karta:znaczenie:${entry.index}`,
        mode: 'karta',
        category: `Karta: ${chapter?.title ?? 'inne'}`,
        kind: 'choice',
        title: 'Co oznacza ostatnia odzywka?',
        subtitle: label,
        cardAuction: {sequence: entry.sequence, section: entry.section, highlightLast: true},
        choices: shuffle(answers.map(answer => answer.value), random),
        answers,
        explanation: `${entry.sequence}: ${entry.description}`,
        links: [{label: 'Pokaż w karcie', to: {pathname: '/cc', hash: `line-${entry.index}`}}],
    }
}

const hasUniqueDescription = (card, entry) => siblingsOf(card, entry)
    .every(other => other.description !== entry.description)

const callQuestion = (card, entry) => {
    const {label, chapter} = cardLocation(card.chapters, entry)
    const call = polishCallToPbn(callsOf(entry.sequence).at(-1))
    const prefix = parentOf(entry.sequence)
    const auction = cardAuctionCalls(prefix, entry.section)
        .map(({seat, call: c}) => ({seat, call: polishCallToPbn(c)}))
    const seat = nextSeat(auction.at(-1)?.seat ?? 'W')
    const siblings = siblingsOf(card, entry)
    const answers = [
        {value: call, score: 100, comment: entry.description},
        ...siblings.map(other => ({
            value: polishCallToPbn(callsOf(other.sequence).at(-1)),
            score: 0,
            comment: other.description,
        })),
    ].filter((answer, index, all) => all.findIndex(a => a.value === answer.value) === index)
    return {
        id: `karta:odzywka:${entry.index}`,
        mode: 'karta',
        category: `Karta: ${chapter?.title ?? 'inne'}`,
        kind: 'call',
        title: 'Co zalicytujesz?',
        subtitle: label,
        prompt: `Twoja ręka: ${entry.description}`,
        cardAuction: {sequence: prefix, section: entry.section, highlightLast: false},
        auction: {calls: auction, firstSeat: 'N', seat},
        answers,
        explanation: `${entry.sequence}: ${entry.description}`,
        links: [{label: 'Pokaż w karcie', to: {pathname: '/cc', hash: `line-${entry.index}`}}],
    }
}

export const conventionQuestion = (card, random = Math.random, {chapterId} = {}) => {
    const pool = chapterId
        ? card.playable.filter(entry => cardLocation(card.chapters, entry).chapter?.id === chapterId)
        : card.playable
    for (let attempt = 0; attempt < 50 && pool.length > 0; attempt++) {
        const entry = pool[Math.floor(random() * pool.length)]
        // "what do you bid" needs a description that points at one call: "3-6, kolor 6+" fits both 1♦-2♥ and 1♦-2♠
        const question = random() < 0.5 || !hasUniqueDescription(card, entry)
            ? meaningQuestion(card, entry, random)
            : callQuestion(card, entry)
        if (question) {
            return question
        }
    }
    return null
}

// ---------- openings ----------

const OPENING_TARGETS = ['1C', '1C', '1D', '1D', '1H', '1S', '1NT', '1NT', '2C', '2D', '2H', '2S', '2NT', '3x', '3NT']

const gamblingHand = random => {
    const suit = random() < 0.5 ? 'D' : 'C'
    const deck = shuffle(['S', 'H', 'D', 'C'].flatMap(s => [...'AKQJT98765432'].map(r => s + r)), random)
    const cards = [`${suit}A`, `${suit}K`, `${suit}Q`]
    cards.push(...deck.filter(card => card[0] === suit && !'AKQ'.includes(card[1])).slice(0, 4))
    cards.push(...deck.filter(card => card[0] !== suit && !'AK'.includes(card[1])).slice(0, 6))
    return cards
}

export const openingQuestion = (cardOpenings, random = Math.random) => {
    const target = OPENING_TARGETS[Math.floor(random() * OPENING_TARGETS.length)]
    const vulnerability = ['none', 'us', 'them', 'both'][Math.floor(random() * 4)]
    const vulnerable = vulnerability === 'us' || vulnerability === 'both'
    let hand = null
    let evaluation = null
    for (let attempt = 0; attempt < 20000; attempt++) {
        const candidate = target === '3NT' && attempt < 50
            ? Object.fromEntries(['S', 'H', 'D', 'C'].map(s => [s, '']))
            : randomHand(random)
        if (target === '3NT' && attempt < 50) {
            for (const card of gamblingHand(random)) {
                candidate[card[0]] += card[1]
            }
            for (const s of ['S', 'H', 'D', 'C']) {
                candidate[s] = [...candidate[s]].sort((a, b) => 'AKQJT98765432'.indexOf(a) - 'AKQJT98765432'.indexOf(b)).join('')
            }
        }
        const result = evaluateOpening(candidate, {vulnerable})
        const matches = target === '3x' ? result.best.startsWith('3') && result.best !== '3NT' : result.best === target
        if (matches || (attempt > 15000 && result.best !== 'Pass')) {
            hand = candidate
            evaluation = result
            break
        }
    }
    const position = 1 + Math.floor(random() * 3)
    const seat = SEATS[Math.floor(random() * 4)]
    const dealer = nextSeat(seat, 4 - (position - 1))
    const calls = withSeats(Array(position - 1).fill('Pass'), dealer)
    const ours = [seat, nextSeat(seat, 2)]
    const vulnerableSeats = {none: [], us: ours, them: SEATS.filter(s => !ours.includes(s)), both: SEATS}[vulnerability]
    return {
        id: `otwarcia:${formatHand(hand)}:${vulnerability}`,
        mode: 'otwarcia',
        category: `Otwarcia: ${evaluation.best === 'Pass' ? 'pas' : evaluation.best}`,
        kind: 'call',
        title: 'Jak otworzysz?',
        context: {vulnerable: vulnerableSeats, dealer, seat},
        auction: {calls, firstSeat: dealer, seat},
        hand: formatHand(hand),
        answers: evaluation.options.map(option => ({value: option.call, score: option.score, comment: option.comment})),
        explanation: `${describeHand(hand)}. ${cardOpenings[evaluation.best] ?? ''}`.trim(),
        links: [{label: 'Otwarcia w karcie', to: {pathname: '/cc', hash: 'chapter-nasze-otwarcia'}}],
    }
}

// Opening descriptions from the card, keyed by PBN call: {'1C': '1♣: 12-14 PC …'}.
export const cardOpeningDescriptions = card => Object.fromEntries(card.entries
    .filter(entry => entry.type === 'opening')
    .map(entry => [polishCallToPbn(entry.sequence), `Karta: ${entry.description}`])
    .filter(([call]) => call))

// ---------- tournaments ----------

const situationLinks = situation => [{
    label: 'Zobacz całe rozdanie',
    to: {pathname: '/pbn', search: `?filename=${encodeURIComponent(situation.file)}&deal=${situation.deal}`},
}]

const situationContext = situation => ({
    vulnerable: situation.vulnerable, dealer: situation.dealer, seat: situation.seat, scoring: situation.scoring,
    event: situation.event, board: situation.board, player: situation.player, author: situation.author,
})

export const situationQuestion = situation => {
    const firstSeat = situation.auctionFirstSeat ?? situation.dealer
    const common = {
        id: `${situation.type === 'lead' ? 'wisty' : 'turnieje'}:${situation.id}`,
        mode: situation.type === 'lead' ? 'wisty' : 'turnieje',
        context: situationContext(situation),
        hand: situation.hand,
        explanation: situation.explanation,
        played: situation.played,
        links: situationLinks(situation),
    }
    if (situation.type === 'lead') {
        return {
            ...common,
            category: 'Wisty',
            kind: 'card',
            title: `Wist przeciw ${situation.contract} ${situation.declarer}`,
            auction: {calls: withSeats(situation.auction, firstSeat), firstSeat, seat: situation.seat},
            answers: situation.options.map(option => ({value: option.card, score: option.score, comment: option.comment})),
        }
    }
    return {
        ...common,
        category: `Turnieje: ${situation.category}`,
        kind: 'call',
        title: 'Co zalicytujesz?',
        auction: {calls: withSeats(situation.auction, firstSeat), firstSeat, seat: situation.seat},
        answers: situation.options.map(option => ({value: option.call, score: option.score, comment: option.comment})),
    }
}

// ---------- grading ----------

const matches = (answerValue, value) => answerValue === value
    || (/^[SHDC]x$/.test(answerValue) && value[0] === answerValue[0] && '98765432'.includes(value[1]))

export const grade = (question, value) => {
    const answer = question.answers.find(a => matches(a.value, value))
    return {score: answer?.score ?? 0, answer: answer ?? null}
}

export const isCorrect = score => score >= 70
