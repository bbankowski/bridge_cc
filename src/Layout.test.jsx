import {render, screen} from '@testing-library/react'
import {createMemoryRouter, RouterProvider} from 'react-router'
import {expect, test} from 'vitest'
import Layout from './Layout'

test('renders the navbar above the current page', () => {
    const router = createMemoryRouter([
        {element: <Layout/>, children: [{path: '/cc', element: <div>card</div>}]},
    ], {initialEntries: ['/cc']})

    render(<RouterProvider router={router}/>)

    expect(screen.getByText('card')).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Home'})).toHaveAttribute('href', '/')
    expect(screen.getByAltText('cards')).toHaveAttribute('src', '/logo-cards.png')
})
