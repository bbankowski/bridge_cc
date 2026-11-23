import {render} from '@testing-library/react'
import {expect, test} from 'vitest'
import DealDiagram from './DealDiagram'

const hands = {
    N: ['AK', 'QJ', 'T9', '8765'],
    E: ['Q', 'K', 'A', 'J'],
    S: ['2', '3', '4', '5'],
    W: ['6', '7', '8', '9'],
}

test('renders the hands, board, dealer and vulnerability', () => {
    const {container} = render(<DealDiagram hands={hands} dealer="E" vulnerable={['N', 'S']} board="7"/>)

    expect(container.querySelector('.DealNumber')).toHaveTextContent('7.')
    expect(container.querySelector('.North')).toHaveTextContent('AKQJT98765')
    expect(container.querySelector('.West')).toHaveTextContent('6789')

    const seat = letter => [...container.querySelectorAll('.Letter')].find(e => e.textContent === letter)
    expect(seat('E')).toHaveClass('Dealer', 'NonVulnerable')
    expect(seat('N')).toHaveClass('NonDealer', 'Vulnerable')
    expect(seat('S')).toHaveClass('Vulnerable')
    expect(seat('W')).toHaveClass('NonVulnerable')
})

test('renders without hands', () => {
    const {container} = render(<DealDiagram hands={null} dealer="N" vulnerable={[]} board="1"/>)

    expect(container.querySelectorAll('.Hand img')).toHaveLength(16)
})

test('highlights the hand and the seat of activeSeat', () => {
    render(<DealDiagram hands={{N: ['A', 'K', 'Q', 'J'], E: [], S: [], W: []}} dealer="N" vulnerable={[]} board="1"
                        activeSeat="E"/>)

    expect(document.querySelector('.East.Hand')).toHaveClass('is-active')
    expect(document.querySelector('.North.Hand')).not.toHaveClass('is-active')
    expect([...document.querySelectorAll('.Letter.is-active')].map(letter => letter.textContent)).toEqual(['E'])
})
