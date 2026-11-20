import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {expect, test} from 'vitest'
import AuctionReplay from './AuctionReplay'

// dealer E: E 1♣, S pas, W 1♦ (note 1), N 1♠, E 2♥, S pas, W 4♥, then three passes
const AUCTION = [
    [null, ['1C'], ['pas'], ['1D', '1']],
    [['1S'], ['2H'], ['pas'], ['4H']],
    [['pas'], ['pas'], ['pas'], null],
]
const NOTES = ['1: naturalne, 4+']

const cells = () => [...document.querySelectorAll('.App-bidTable tbody tr')]
    .map(row => [...row.querySelectorAll('td')].map(td => td.textContent).join('|'))

test('starts before our first call with "?" on our seat', () => {
    render(<AuctionReplay auction={AUCTION} notes={NOTES} mySeat="W"/>)

    expect(cells()).toEqual(['|1|pas|?'])
    expect(screen.getByText('Twoja kolej – co mówisz?')).toBeInTheDocument()
    expect(screen.queryByText(/naturalne/)).toBeNull()
})

test('reveals call by call, with the notes of the calls shown', async () => {
    render(<AuctionReplay auction={AUCTION} notes={NOTES} mySeat="W"/>)

    await userEvent.click(screen.getByRole('button', {name: 'Następna odzywka'}))
    expect(cells()).toEqual(['|1|pas|11', '|||'])
    expect(screen.getByText(/naturalne/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', {name: 'Poprzednia odzywka'}))
    expect(cells()).toEqual(['|1|pas|?'])
})

test('"Do mojej odzywki" jumps to our next decision, then to the end', async () => {
    render(<AuctionReplay auction={AUCTION} notes={NOTES} mySeat="W"/>)

    await userEvent.click(screen.getByRole('button', {name: /Do mojej odzywki/}))
    expect(cells()).toEqual(['|1|pas|11', '1|2|pas|?'])

    await userEvent.click(screen.getByRole('button', {name: /Do mojej odzywki/}))
    expect(screen.getByText('Cała licytacja')).toBeInTheDocument()
    expect(cells()).toHaveLength(3)
    expect(screen.getByRole('button', {name: /Do mojej odzywki/})).toBeDisabled()
})

test('the whole auction and back to the start', async () => {
    render(<AuctionReplay auction={AUCTION} notes={NOTES} mySeat="S"/>)
    expect(cells()).toEqual(['|1|?|'])

    await userEvent.click(screen.getByRole('button', {name: 'Cała licytacja'}))
    expect(cells()).toHaveLength(3)
    await userEvent.click(screen.getByRole('button', {name: 'Początek licytacji'}))
    expect(cells()).toEqual(['|||'])
})
