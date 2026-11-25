import {render} from '@testing-library/react'
import {expect, test} from 'vitest'
import BidGrid from './BidGrid'

const rows = container => [...container.querySelectorAll('tr')].map(row => [...row.querySelectorAll('td')].map(td => td.textContent))

test('ends the auction with "?" for our call', () => {
    const {container} = render(<BidGrid sequence="1P-3C"/>)

    expect(rows(container)).toEqual([['1', '(pas)', '3', '(pas)'], ['?', '', '', '']])
})

// the reported case: "1♠ (pas) 3♥ (pas)" showed a second, empty row
test('without "?" ends on the last call, with no empty row', () => {
    const {container} = render(<BidGrid sequence="1P-3C" withoutQuestion highlightLast/>)

    expect(rows(container)).toEqual([['1', '(pas)', '3', '(pas)']])
    expect(container.querySelector('.is-highlighted')).toHaveTextContent('3')
})

test('puts the calls of the opponents in parentheses and highlights the last call', () => {
    const {container} = render(<BidGrid sequence="(1T)-X" withoutQuestion highlightLast/>)

    expect(rows(container)).toEqual([['(1)', 'X', '', '']])
    expect(container.querySelector('.is-highlighted')).toHaveTextContent('X')
})
