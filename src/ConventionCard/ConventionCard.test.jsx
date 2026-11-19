import {render, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {createMemoryRouter, RouterProvider} from 'react-router'
import {expect, test} from 'vitest'
import ConventionCard from './ConventionCard'

const renderCard = (url = '/cc') => {
    const router = createMemoryRouter([{path: '/cc', element: <ConventionCard/>}], {initialEntries: [url]})
    render(<RouterProvider router={router}/>)
    return router
}

test('renders the openings index and the bidding from bidding.txt', () => {
    renderCard()

    const openings = document.querySelectorAll('.App-openings a')
    expect(openings.length).toBeGreaterThan(10)
    expect(openings[0]).toHaveTextContent(/^1.*12-14 PC/)
    expect(document.getElementById('opening-1T')).toBeInTheDocument()
    expect(document.getElementById('bid-1T-1K')).toHaveTextContent('Licytacja po 1-1: negat')
})

test('scrolls to the opening clicked in the index and keeps it in the URL', async () => {
    const router = renderCard()

    const index = within(document.querySelector('.App-openings'))
    await userEvent.click(index.getByRole('link', {name: /^1BA/}))

    expect(router.state.location.hash).toBe('#opening-1BA')
    expect(document.getElementById('opening-1BA').scrollIntoView).toHaveBeenCalled()
})

test('scrolls to the anchor from the URL', () => {
    renderCard('/cc#bid-1T-1K')

    expect(document.getElementById('bid-1T-1K').scrollIntoView).toHaveBeenCalled()
})

test('shows opponent calls in parentheses', () => {
    renderCard()

    const cells = [...document.getElementById('bid-1T-1K').querySelectorAll('td')].map(td => td.textContent)
    expect(cells).toEqual(['1', '(pas)', '1', '(pas)', '?', '(pas)', '', ''])
})
