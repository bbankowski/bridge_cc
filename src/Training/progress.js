import {isCorrect} from './questions'

/*
 * Training progress kept in the browser (localStorage), per device:
 * - categories: {[category]: {answered, scoreSum}}
 * - review: questions answered wrong, with a Leitner box; a question leaves the review after REVIEW_BOXES correct answers
 * - sessions: the last sessions' results
 */
const KEY = 'bridge-training-v1'
const REVIEW_BOXES = 2
const MAX_REVIEW = 200
const MAX_SESSIONS = 30

export const emptyProgress = () => ({categories: {}, review: {}, sessions: []})

export const loadProgress = (storage = globalThis.localStorage) => {
    try {
        const saved = JSON.parse(storage?.getItem(KEY) ?? 'null')
        return saved ? {...emptyProgress(), ...saved} : emptyProgress()
    } catch {
        return emptyProgress()
    }
}

export const saveProgress = (progress, storage = globalThis.localStorage) => {
    try {
        storage?.setItem(KEY, JSON.stringify(progress))
    } catch {
        // storage unavailable (private mode, quota) – progress is only kept for this page view
    }
}

export const recordAnswer = (progress, question, score, now = Date.now()) => {
    const category = progress.categories[question.category] ?? {answered: 0, scoreSum: 0}
    const categories = {...progress.categories, [question.category]: {answered: category.answered + 1, scoreSum: category.scoreSum + score}}
    const review = {...progress.review}
    const existing = review[question.id]
    if (!isCorrect(score)) {
        review[question.id] = {question, box: 0, lastSeen: now}
    } else if (existing) {
        if (existing.box + 1 >= REVIEW_BOXES) {
            delete review[question.id]
        } else {
            review[question.id] = {...existing, box: existing.box + 1, lastSeen: now}
        }
    }
    const ids = Object.keys(review)
    if (ids.length > MAX_REVIEW) {
        ids.sort((a, b) => review[a].lastSeen - review[b].lastSeen).slice(0, ids.length - MAX_REVIEW)
            .forEach(id => delete review[id])
    }
    return {...progress, categories, review}
}

export const recordSession = (progress, session, now = Date.now()) => ({
    ...progress,
    sessions: [{date: now, mode: session.mode, count: session.results.length,
        score: Math.round(session.results.reduce((sum, r) => sum + r.score, 0) / Math.max(session.results.length, 1))},
        ...progress.sessions].slice(0, MAX_SESSIONS),
})

// Questions to review, the least known and the longest unseen first.
export const reviewQuestions = (progress, mode = null) => Object.values(progress.review)
    .filter(item => !mode || item.question.mode === mode)
    .sort((a, b) => a.box - b.box || a.lastSeen - b.lastSeen)
    .map(item => item.question)
