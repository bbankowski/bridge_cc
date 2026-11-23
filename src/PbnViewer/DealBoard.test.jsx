import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {expect, test} from 'vitest'
import DealBoard from './DealBoard'

const deal = playLines => ({
    board: '5', dealer: 'N', vulnerable: [], contract: '3S',
    hands: {N: ['A2', 'K5', 'AT', 'Q9'], E: ['K3', 'T4', 'QJ', 'J8'], S: ['Q4', 'Q3', '94', 'K7'], W: ['J5', '76', '82', 'T6']},
    rawLines: ['[Event "x"]', '[Play "N"]', ...playLines, '[Score "x"]'],
})

const handText = seat => document.querySelector(`.DealDiagram .${seat}`).textContent

test('replays the play card by card and trick by trick', async () => {
    render(<DealBoard deal={deal(['H5 HT HQ H6', 'DA DQ D4 D2'])}/>)
    // the controls show up after "▶"
    expect(document.querySelector('.PlayControls')).toBeNull()
    await userEvent.click(screen.getByRole('button', {name: 'Odtwórz rozgrywkę'}))
    expect(screen.getByText('Rozgrywka: 2 lewy w zapisie')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', {name: 'Następna karta'}))
    expect(handText('North')).not.toContain('5')
    expect(document.querySelectorAll('.TrickCard')).toHaveLength(1)

    await userEvent.click(screen.getByRole('button', {name: 'Następna lewa'}))
    expect(document.querySelectorAll('.TrickCard')).toHaveLength(4)
    expect(screen.getByText('Lewa 1 z 2 · NS 1 : EW 0')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', {name: 'Następna karta'}))
    // the second trick is led by S, who won the first one
    expect(document.querySelectorAll('.TrickCard')).toHaveLength(1)
    expect(document.querySelector('.Middle').textContent).toContain('4')

    await userEvent.click(screen.getByRole('button', {name: 'Koniec'}))
    expect(screen.getByText('Lewa 2 z 2 · NS 2 : EW 0')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Następna karta'})).toBeDisabled()

    await userEvent.click(screen.getByRole('button', {name: 'Poprzednia lewa'}))
    expect(screen.getByText('Lewa 1 z 2 · NS 1 : EW 0')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', {name: 'Początek'}))
    expect(document.querySelectorAll('.TrickCard')).toHaveLength(0)
    expect(handText('North')).toContain('5')
})

test('closes the replay and shows the whole hands again', async () => {
    render(<DealBoard deal={deal(['H5 HT HQ H6', 'DA DQ D4 D2'])}/>)
    await userEvent.click(screen.getByRole('button', {name: 'Odtwórz rozgrywkę'}))
    await userEvent.click(screen.getByRole('button', {name: 'Koniec'}))

    await userEvent.click(screen.getByRole('button', {name: 'Zamknij rozgrywkę'}))

    expect(document.querySelector('.PlayControls')).toBeNull()
    expect(document.querySelectorAll('.TrickCard')).toHaveLength(0)
    expect(handText('North')).toContain('5')
})

test('has no replay when only the lead is recorded or the hands are covered', () => {
    const {rerender} = render(<DealBoard deal={deal(['DA'])}/>)
    expect(screen.queryByRole('button', {name: 'Odtwórz rozgrywkę'})).toBeNull()

    rerender(<DealBoard deal={deal(['H5 HT HQ H6'])} hiddenSeats={['N', 'E', 'W']}/>)
    expect(screen.queryByRole('button', {name: 'Odtwórz rozgrywkę'})).toBeNull()
})

test('has no controls without a play record', () => {
    render(<DealBoard deal={deal([])}/>)

    expect(document.querySelector('.PlayControls')).toBeNull()
})
