import fs from 'node:fs'
import path from 'node:path'
import {describe, expect, test} from 'vitest'
import {dealResult, formatResult, isGain, isLoss, parseFilters, visibleDeals} from './dealFilters'
import {parsePbn} from './pbn'

const deal = commentText => ({commentText})

describe('dealResult', () => {
    test.each([
        ['WYNIK: -7 (na drugim stole 3BA)', {type: 'imp', value: -7}],
        ['MJ: ...\n\nWYNIK: +11 (na drugim stole 3\\D)', {type: 'imp', value: 11}],
        ['WYNIK = 0', {type: 'imp', value: 0}],
        ['WYNIK: 67.39%', {type: 'pct', value: 67.39}],
        ['WYNIK: 34,78 %', {type: 'pct', value: 34.78}],
        ['WYNIL: -1 (na drugim stole 3\\S-2)', {type: 'imp', value: -1}],
        ['bez wyniku', null],
        ['', null],
    ])('%j', (comment, expected) => {
        expect(dealResult(deal(comment))).toEqual(expected)
    })

    test('takes the result of the deal, not the final result of the match', () => {
        expect(dealResult(deal('WYNIK: 0 (to samo)\n\nOSTATECZNY WYNIK: Wygrywamy 69 : 32'))).toEqual({type: 'imp', value: 0})
    })

    test('reads a result from most commented deals of every file with results', () => {
        const dir = path.join(import.meta.dirname, '../../public')
        for (const file of ['3liga_2025-2026_3zjazd.pbn', '2liga_3zjazd.pbn', '4kroli.pbn', '2024.06.23-Slawa_GPP.pbn']) {
            const {deals} = parsePbn(fs.readFileSync(path.join(dir, file), 'utf8'))
            const commented = deals.filter(d => d.commentText.trim())
            expect(commented.filter(d => dealResult(d)).length / commented.length, file).toBeGreaterThan(0.85)
        }
    })
})

test('losses and gains', () => {
    expect([isLoss({type: 'imp', value: -1}), isLoss({type: 'imp', value: 0}), isLoss({type: 'pct', value: 49.9}), isLoss(null)])
        .toEqual([true, false, true, false])
    expect([isGain({type: 'imp', value: 3}), isGain({type: 'pct', value: 50}), isGain({type: 'pct', value: 75})])
        .toEqual([true, false, true])
})

test('formatResult', () => {
    expect([formatResult({type: 'imp', value: 5}), formatResult({type: 'imp', value: -3}), formatResult({type: 'pct', value: 41.3}), formatResult(null)])
        .toEqual(['+5 IMP', '-3 IMP', '41.3%', null])
})

test('parseFilters ignores unknown names', () => {
    expect(parseFilters('straty,xyz,komentarz')).toEqual(['straty', 'komentarz'])
    expect(parseFilters(null)).toEqual([])
})

test('visibleDeals', () => {
    const deals = [deal(''), deal('WYNIK: -3'), deal('WYNIK: +2'), deal('ciekawe')]

    expect(visibleDeals(deals, [])).toEqual([0, 1, 2, 3])
    expect(visibleDeals(deals, ['komentarz'])).toEqual([1, 2, 3])
    expect(visibleDeals(deals, ['straty'])).toEqual([1])
})
