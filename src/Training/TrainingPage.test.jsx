import {render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {createMemoryRouter, RouterProvider} from 'react-router'
import {beforeEach, describe, expect, test, vi} from 'vitest'
import BiddingBox from './BiddingBox'
import {withSeats} from './calls'
import HandView from './HandView'
import QuestionView from './QuestionView'
import TrainingPage from './TrainingPage'

const renderPage = () => {
    const router = createMemoryRouter([{path: '/trening', element: <TrainingPage/>}], {initialEntries: ['/trening']})
    render(<RouterProvider router={router}/>)
    return router
}

const answerCurrent = async () => {
    const question = document.querySelector('.Training-question')
    const choice = question.querySelector('.Training-choice')
    const card = question.querySelector('.HandView-card')
    const call = [...question.querySelectorAll('.BiddingBox button')].find(b => !b.disabled)
    await userEvent.click(choice ?? card ?? call)
}

describe('TrainingPage', () => {
    beforeEach(() => {
        localStorage.clear()
        sessionStorage.clear()
        vi.spyOn(Math, 'random')
    })

    test('runs a whole test and shows the summary', async () => {
        renderPage()

        await userEvent.click(screen.getByRole('button', {name: /^5$/}))
        await userEvent.click(screen.getByRole('button', {name: 'Zaczynamy'}))
        for (let i = 0; i < 5; i++) {
            expect(screen.getByText(`Pytanie ${i + 1} z 5`)).toBeInTheDocument()
            await answerCurrent()
            expect(document.querySelector('.Training-feedback')).toBeInTheDocument()
            await userEvent.click(screen.getByRole('button', {name: i === 4 ? 'Pokaż wynik' : 'Dalej'}))
        }

        expect(screen.getByRole('heading', {name: /^Wynik: \d+%$/})).toBeInTheDocument()
        expect(JSON.parse(localStorage.getItem('bridge-training-v1')).sessions).toHaveLength(1)
    })

    test.each([
        ['Karta konwencyjna', 'karta'],
        ['Otwarcia', 'otwarcia'],
        ['Z turniejów', 'turnieje'],
        ['Wisty', 'wisty'],
    ])('starts a %s test', async (label, mode) => {
        renderPage()

        await userEvent.click(screen.getByRole('button', {name: new RegExp(`^${label}`)}))
        await userEvent.click(screen.getByRole('button', {name: 'Zaczynamy'}))

        const session = JSON.parse(sessionStorage.getItem('bridge-training-session'))
        expect(session.questions.every(q => q.mode === mode)).toBe(true)
    })

    test('shows the context, the hand and the coach explanation of a tournament situation', async () => {
        renderPage()
        await userEvent.click(screen.getByRole('button', {name: /^Z turniejów/}))
        await userEvent.click(screen.getByRole('button', {name: 'Zaczynamy'}))

        const header = [...document.querySelectorAll('.Training-auction th')]
        expect(header.every(th => th.matches('.is-vulnerable, .is-not-vulnerable'))).toBe(true)
        expect(header.filter(th => th.textContent.includes('(ty)'))).toHaveLength(1)
        expect(screen.getByText('Twoja ręka')).toBeInTheDocument()
        await answerCurrent()
        expect(screen.getByText('Przy stole:')).toBeInTheDocument()
        expect(screen.getByRole('link', {name: 'Zobacz całe rozdanie →'})).toHaveAttribute('href', expect.stringMatching(/^\/pbn\?filename=.*&deal=\d+$/))
    })

    test('keeps wrong answers for review and offers to repeat them', async () => {
        renderPage()
        await userEvent.click(screen.getByRole('button', {name: /^Z turniejów/}))
        await userEvent.click(screen.getByRole('button', {name: /^5$/}))
        await userEvent.click(screen.getByRole('button', {name: 'Zaczynamy'}))
        for (let i = 0; i < 5; i++) {
            // the box is answered with the highest legal call, which is almost never right
            const calls = [...document.querySelectorAll('.BiddingBox button')].filter(b => !b.disabled)
            await userEvent.click(calls.find(b => b.getAttribute('aria-label') === '7NT') ?? calls[0])
            await userEvent.click(screen.getByRole('button', {name: i === 4 ? 'Pokaż wynik' : 'Dalej'}))
        }

        await userEvent.click(screen.getByRole('button', {name: /^Powtórz błędne/}))
        expect(screen.getByText(/^Pytanie 1 z \d$/)).toBeInTheDocument()
        await userEvent.click(screen.getByRole('button', {name: 'Przerwij'}))
        expect(screen.getByRole('button', {name: /^Powtórka błędów/})).toBeInTheDocument()
        expect(screen.getByText(/Dołącz pytania do powtórki \(\d\)/)).toBeInTheDocument()
    })

    test('restores the test after a page reload', async () => {
        const {unmount} = render(<RouterProvider router={createMemoryRouter([{path: '/', element: <TrainingPage/>}])}/>)
        await userEvent.click(screen.getByRole('button', {name: 'Zaczynamy'}))
        await answerCurrent()
        await userEvent.click(screen.getByRole('button', {name: 'Dalej'}))
        unmount()

        renderPage()

        expect(screen.getByText('Pytanie 2 z 10')).toBeInTheDocument()
    })

    test('clears the results after confirmation', async () => {
        localStorage.setItem('bridge-training-v1', JSON.stringify({categories: {'Kat': {answered: 1, scoreSum: 0}}, review: {}, sessions: []}))
        renderPage()

        await userEvent.click(screen.getByRole('button', {name: 'Wyczyść wyniki'}))
        await userEvent.click(screen.getByRole('button', {name: 'Usuń'}))

        expect(screen.queryByText('Twoje wyniki')).toBeNull()
    })
})

test('BiddingBox disables calls that are not legal', async () => {
    const onSelect = vi.fn()
    render(<BiddingBox calls={withSeats(['1H', 'Pass', '1S'], 'N')} seat="W" onSelect={onSelect}/>)

    expect(screen.getByRole('button', {name: '1S'})).toBeDisabled()
    expect(screen.getByRole('button', {name: 'XX'})).toBeDisabled()
    await userEvent.click(screen.getByRole('button', {name: '1NT'}))
    await userEvent.click(screen.getByRole('button', {name: 'X'}))
    expect(onSelect.mock.calls).toEqual([['1NT'], ['X']])
})

test('HandView lets choose a lead card', async () => {
    const onSelectCard = vi.fn()
    render(<HandView hand="AKT.Q2..J98765432" onSelectCard={onSelectCard}/>)

    expect(within(document.querySelector('.HandView')).getByRole('button', {name: 'ST'})).toHaveTextContent('10')
    expect(screen.getByText('—')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', {name: 'HQ'}))
    expect(onSelectCard).toHaveBeenCalledWith('HQ')
})

test('marks vulnerability and our seat in the auction header', () => {
    const question = {
        id: 'q', kind: 'call', title: 'Jak otworzysz?', hand: 'AKQ2.K32.Q2.J432',
        context: {vulnerable: ['E', 'W'], dealer: 'E', seat: 'W'},
        auction: {calls: withSeats(['Pass', 'Pass'], 'E'), firstSeat: 'E', seat: 'W'},
        answers: [{value: '1C', score: 100, comment: ''}],
    }
    render(<RouterProvider router={createMemoryRouter([{path: '/', element: <QuestionView question={question} result={null} onAnswer={vi.fn()}/>}])}/>)

    const header = Object.fromEntries([...document.querySelectorAll('.Training-auction th')].map(th => [th.textContent[0], th]))
    expect(header.E).toHaveClass('is-vulnerable')
    expect(header.W).toHaveClass('is-vulnerable', 'is-our-seat')
    expect(header.N).toHaveClass('is-not-vulnerable')
    expect(header.W).toHaveTextContent('W (ty)')
    expect(screen.queryByText(/^My:/)).toBeNull()
})
