import {shuffle} from './hands'
import {conventionQuestion, openingQuestion, situationQuestion} from './questions'

/*
 * Builds the questions of a test.
 * options: {mode: 'karta' | 'otwarcia' | 'turnieje' | 'wisty' | 'mieszany' | 'powtorka', count, chapterId, scoring,
 *           includeReview}
 * sources: {card, openingDescriptions, situations, review: [questions to review]}
 */
const REVIEW_SHARE = 0.3

export const availableModes = sources => ({
    karta: sources.card.playable.length > 0,
    otwarcia: true,
    turnieje: sources.situations.some(s => s.type === 'bid'),
    wisty: sources.situations.some(s => s.type === 'lead'),
})

const filterSituations = (situations, type, scoring) => situations
    .filter(s => s.type === type && (!scoring || s.scoring === scoring))

const generator = (mode, sources, options, random) => {
    if (mode === 'karta') {
        return () => conventionQuestion(sources.card, random, {chapterId: options.chapterId})
    }
    if (mode === 'otwarcia') {
        return () => openingQuestion(sources.openingDescriptions, random)
    }
    const pool = shuffle(filterSituations(sources.situations, mode === 'wisty' ? 'lead' : 'bid', options.scoring), random)
    let next = 0
    return () => (next < pool.length ? situationQuestion(pool[next++]) : null)
}

export const buildSession = (options, sources, random = Math.random) => {
    const {count} = options
    if (options.mode === 'powtorka') {
        return sources.review.slice(0, count)
    }
    const available = availableModes(sources)
    const modes = options.mode === 'mieszany'
        ? Object.keys(available).filter(mode => available[mode])
        : [options.mode]
    const generators = Object.fromEntries(modes.map(mode => [mode, generator(mode, sources, options, random)]))

    const review = options.includeReview
        ? sources.review.filter(q => modes.includes(q.mode)).slice(0, Math.floor(count * REVIEW_SHARE))
        : []
    const questions = [...review]
    const ids = new Set(questions.map(q => q.id))
    let exhausted = 0
    for (let i = 0; questions.length < count && exhausted < modes.length * 20; i++) {
        const mode = modes[i % modes.length]
        const question = generators[mode]()
        if (!question || ids.has(question.id)) {
            exhausted++
            continue
        }
        ids.add(question.id)
        questions.push(question)
    }
    return shuffle(questions, random)
}
