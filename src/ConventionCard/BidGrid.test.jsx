import {render} from '@testing-library/react'
import {expect, test} from 'vitest'
import BidGrid from './BidGrid'

const rows = container => [...container.querySelectorAll('tr')].map(row => [...row.querySelectorAll('td')].map(td => td.textContent))

test('ends the auction with "?" for our call', () => {
    const {container} = render(<BidGrid sequence="1P-3C" section={null}/>)

    expect(rows(container)).toEqual([['1', '(pas)', '3', '(pas)'], ['?', '', '', '']])
})

// the reported case: "1♠ (pas) 3♥ (pas)" showed a second, empty row
test('without "?" ends on the last call, with no empty row', () => {
    const {container} = render(<BidGrid sequence="1P-3C" section={null} withoutQuestion highlightLast/>)

    expect(rows(container)).toEqual([['1', '(pas)', '3', '(pas)']])
    expect(container.querySelector('.is-highlighted')).toHaveTextContent('3')
})

test('highlights the last call in a section where the opponents open', () => {
    const {container} = render(<BidGrid sequence="1T-X" section="^" withoutQuestion highlightLast/>)

    expect(rows(container)).toEqual([['(1)', 'X', '', '']])
    expect(container.querySelector('.is-highlighted')).toHaveTextContent('X')
})
