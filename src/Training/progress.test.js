import {describe, expect, test} from 'vitest'
import {emptyProgress, loadProgress, recordAnswer, recordSession, reviewQuestions, saveProgress} from './progress'

const question = (id, mode = 'karta') => ({id, mode, category: `Kat ${mode}`})

describe('progress', () => {
    test('sums scores per category', () => {
        let progress = emptyProgress()
        progress = recordAnswer(progress, question('a'), 100)
        progress = recordAnswer(progress, question('b'), 40)

        expect(progress.categories['Kat karta']).toEqual({answered: 2, scoreSum: 140})
    })

    test('keeps wrong answers for review until answered right twice', () => {
        let progress = recordAnswer(emptyProgress(), question('a'), 0, 1)
        expect(reviewQuestions(progress).map(q => q.id)).toEqual(['a'])

        progress = recordAnswer(progress, question('a'), 100, 2)
        expect(reviewQuestions(progress)).toHaveLength(1)
        progress = recordAnswer(progress, question('a'), 100, 3)
        expect(reviewQuestions(progress)).toHaveLength(0)
    })

    test('a wrong answer puts the question back to the start', () => {
        let progress = recordAnswer(emptyProgress(), question('a'), 0, 1)
        progress = recordAnswer(progress, question('a'), 100, 2)
        progress = recordAnswer(progress, question('a'), 10, 3)
        expect(progress.review.a.box).toBe(0)
    })

    test('orders reviews by box and age, filtered by mode', () => {
        let progress = emptyProgress()
        progress = recordAnswer(progress, question('old', 'karta'), 0, 1)
        progress = recordAnswer(progress, question('new', 'karta'), 0, 5)
        progress = recordAnswer(progress, question('lead', 'wisty'), 0, 3)

        expect(reviewQuestions(progress).map(q => q.id)).toEqual(['old', 'lead', 'new'])
        expect(reviewQuestions(progress, 'wisty').map(q => q.id)).toEqual(['lead'])
    })

    test('records sessions, newest first', () => {
        const progress = recordSession(emptyProgress(), {mode: 'karta', results: [{score: 100}, {score: 50}]}, 7)

        expect(progress.sessions).toEqual([{date: 7, mode: 'karta', count: 2, score: 75}])
    })

    test('saves and loads, and survives broken or missing storage', () => {
        const store = {}
        const storage = {getItem: key => store[key] ?? null, setItem: (key, value) => { store[key] = value }}
        const progress = recordAnswer(emptyProgress(), question('a'), 0)

        saveProgress(progress, storage)
        expect(loadProgress(storage)).toEqual(progress)
        expect(loadProgress({getItem: () => '{broken'})).toEqual(emptyProgress())
        expect(loadProgress({getItem: () => { throw new Error('denied') }})).toEqual(emptyProgress())
        expect(() => saveProgress(progress, {setItem: () => { throw new Error('quota') }})).not.toThrow()
    })
})
