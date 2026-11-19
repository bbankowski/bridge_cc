import {render} from '@testing-library/react'
import {expect, test} from 'vitest'
import Minimax from './Minimax'

const optimumResults = {
    N: {NT: '6', S: '4', H: '4', D: '10', C: '10'},
    S: {NT: '6', S: '4', H: '4', D: '10', C: '10'},
    E: {NT: '3', S: '9', H: '8', D: '3', C: '3'},
    W: {NT: '3', S: '9', H: '8', D: '3', C: '3'},
}

test('renders double dummy tables and the minimax contract', () => {
    const {container} = render(<Minimax minimax={{contract: '4SX', declarer: 'W', score: '100'}}
                                        optimumResults={optimumResults}/>)

    const rows = [...container.querySelectorAll('tbody tr')].map(row => row.textContent)
    expect(rows).toEqual(['N6441010', 'S6441010', 'W39833', 'E39833'])
    expect(container.querySelector('.MinimaxValue')).toHaveTextContent('Minimax: 4X W 100')
})

test('renders nothing when the deal has no double dummy data', () => {
    const {container} = render(<Minimax minimax={null} optimumResults={null}/>)

    expect(container.querySelector('table')).toBeNull()
    expect(container.querySelector('.MinimaxValue')).toBeNull()
})
