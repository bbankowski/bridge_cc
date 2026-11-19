import {render, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {createMemoryRouter, RouterProvider} from 'react-router'
import {beforeEach, describe, expect, test, vi} from 'vitest'
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
    expect(cells).toEqual(['1', '(pas)', '1', '(pas)', '?', '', '', ''])
})

// https://github.com/bbankowski/bridge_cc/issues/12
test('links 1BA-2C after our 1NT opening to the uncontested auction, not the one after an overcall', async () => {
    const router = renderCard()
    const transfer = [...document.querySelectorAll('.App-bidLine a')]
        .find(link => link.getAttribute('href') === '/cc#bid-1BA-2C' && link.textContent.includes('transfer na piki'))

    await userEvent.click(transfer)

    expect(router.state.location.hash).toBe('#bid-1BA-2C')
    const table = document.getElementById('bid-1BA-2C')
    expect(table.scrollIntoView).toHaveBeenCalled()
    const cells = [...table.querySelectorAll('td')].map(td => td.textContent)
    expect(cells).toEqual(['1BA', '(pas)', '2', '(pas)', '?', '', '', ''])
})

test('has unique ids and every link points to an existing table', () => {
    renderCard()

    const ids = [...document.querySelectorAll('[id]')].map(element => element.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const link of document.querySelectorAll('.App-bidLine a')) {
        const id = link.getAttribute('href').split('#')[1]
        expect(document.getElementById(id), id).toBeInTheDocument()
    }
})

const sidebar = () => within(document.querySelector('.ConventionCard-sidebar'))
const shownChapters = () => [...document.querySelectorAll('.ConventionCard-chapterTitle')].map(title => title.textContent)

describe('chapters and menu', () => {
    beforeEach(() => {
        // jsdom has no layout: put every element below the fold of a long page, so the first section is active
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({top: 1000})
        vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(100000)
    })

    test('shows the four chapters with their own headings', () => {
        renderCard()

        expect(shownChapters()).toEqual(['Nasze otwarcia', 'Po interwencji przeciwników', 'W obronie', 'Konwencje'])
        const konwencje = document.getElementById('chapter-konwencje')
        expect(within(konwencje).getByRole('heading', {name: 'Po blackwoodzie'})).toBeInTheDocument()
    })

    test('lists the chapters and expands the active one with its openings', () => {
        renderCard()

        const menu = sidebar()
        expect(menu.getAllByRole('link').map(link => link.textContent)).toEqual(expect.arrayContaining(
            ['Nasze otwarcia', 'Po interwencji przeciwników', 'W obronie', 'Konwencje', 'Po pasie', '1BA']))
        expect(menu.queryByRole('link', {name: 'Po polskim treflu'})).toBeNull()
    })

    test('jumps to a section from the menu', async () => {
        const router = renderCard()

        await userEvent.click(sidebar().getByRole('link', {name: 'Konwencje'}))

        expect(router.state.location.hash).toBe('#chapter-konwencje')
        expect(Element.prototype.scrollIntoView.mock.contexts).toContain(document.getElementById('chapter-konwencje'))
    })

    test('searches the card, filters the menu and highlights matching lines', async () => {
        const router = renderCard()

        await userEvent.type(sidebar().getByRole('searchbox', {name: 'Szukaj w karcie'}), 'transfer na piki')

        const results = sidebar().getAllByRole('link').filter(link => link.closest('.menu-list'))
        const oneNoTrump = results.find(link => /^1BA\d+$/.test(link.textContent))
        expect(oneNoTrump).toBeDefined()
        const highlighted = [...document.querySelectorAll('.is-search-match')].map(line => line.textContent)
        expect(highlighted.length).toBeGreaterThan(0)
        // every word of the query, in any order
        expect(highlighted.every(text => /transfer/i.test(text) && /piki/i.test(text))).toBe(true)

        await userEvent.click(oneNoTrump)
        const target = document.getElementById(router.state.location.hash.substring(1))
        expect(target).toHaveClass('is-search-match')
    })

    test('says when nothing was found', async () => {
        renderCard()

        await userEvent.type(sidebar().getByRole('searchbox'), 'nie ma takiej licytacji')

        expect(sidebar().getByText('Brak wyników.')).toBeInTheDocument()
    })

    test('shows a single chapter and switches chapters from the menu', async () => {
        const router = renderCard()

        await userEvent.click(sidebar().getByRole('link', {name: 'Pokaż tylko ten rozdział'}))
        expect(router.state.location.search).toBe('?chapter=chapter-nasze-otwarcia')
        expect(shownChapters()).toEqual(['Nasze otwarcia'])

        await userEvent.click(sidebar().getByRole('link', {name: 'W obronie'}))
        expect(router.state.location.search).toBe('?chapter=chapter-w-obronie')
        expect(shownChapters()).toEqual(['W obronie'])

        await userEvent.click(sidebar().getByRole('link', {name: 'Pokaż całą kartę'}))
        expect(router.state.location.search).toBe('')
        expect(shownChapters()).toHaveLength(4)
    })

    test('opens the single chapter from the URL', () => {
        renderCard('/cc?chapter=chapter-konwencje#chapter-konwencje')

        expect(shownChapters()).toEqual(['Konwencje'])
    })

    test('opens the table of contents on mobile and closes it after choosing a section', async () => {
        renderCard()
        const bar = within(document.querySelector('.ConventionCard-mobileBar'))

        await userEvent.click(bar.getByRole('button'))
        const mobileMenu = within(document.querySelector('.ConventionCard-mobileMenu'))
        await userEvent.click(mobileMenu.getByRole('link', {name: 'W obronie'}))

        expect(document.querySelector('.ConventionCard-mobileMenu')).toBeNull()
        expect(bar.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
    })
})
