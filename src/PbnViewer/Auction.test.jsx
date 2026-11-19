import {render, within} from '@testing-library/react'
import {expect, test} from 'vitest'
import Auction from './Auction'

test('renders calls in N/E/S/W columns with note markers and notes', () => {
    const auction = [
        [null, ['1H', '1'], ['pas'], ['2NT']],
        [['pas'], ['pas'], ['pas'], null],
    ]

    const {container, getByText} = render(<Auction auction={auction} notes={['1: \\H naturalne']}/>)

    const rows = container.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(2)
    const firstRow = rows[0].querySelectorAll('td')
    expect(firstRow[0]).toHaveTextContent('')
    expect(within(firstRow[1]).getByAltText('H')).toBeInTheDocument()
    expect(firstRow[1].querySelector('.BidNote')).toHaveTextContent('1')
    expect(firstRow[3]).toHaveTextContent('2NT')
    expect(getByText(/naturalne/)).toBeInTheDocument()
})

test('renders no notes section without notes', () => {
    const {container} = render(<Auction auction={[]} notes={[]}/>)

    expect(container.querySelector('.BidNotes')).toBeNull()
})
