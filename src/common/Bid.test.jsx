import {render} from '@testing-library/react'
import {describe, expect, test} from 'vitest'
import Bid from './Bid'

describe('Bid', () => {
    test('renders a suit bid with an icon', () => {
        const {container, getByAltText} = render(<Bid bid="4H"/>)

        expect(container).toHaveTextContent('4')
        expect(getByAltText('H')).toBeInTheDocument()
    })

    test.each([['3DX', 'X'], ['2SXX', 'XX']])('renders a doubled contract %s', (bid, doubled) => {
        const {container} = render(<Bid bid={bid}/>)

        expect(container).toHaveTextContent(new RegExp(`^\\d${doubled}$`))
        expect(container.querySelectorAll('img')).toHaveLength(1)
    })

    test.each(['3NT', '1BA', 'pas', 'X', '?'])('renders %s as text', bid => {
        const {container} = render(<Bid bid={bid}/>)

        expect(container).toHaveTextContent(bid)
        expect(container.querySelector('img')).toBeNull()
    })

    test('renders nothing for a missing contract', () => {
        const {container} = render(<Bid/>)

        expect(container).toHaveTextContent('')
    })
})
