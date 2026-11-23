import fs from 'node:fs'
import path from 'node:path'
import {act, render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {createMemoryRouter, RouterProvider} from 'react-router'
import {beforeEach, describe, expect, test, vi} from 'vitest'
import PbnViewer from './PbnViewer'

const deal = (board, comment) => `[Event "Mecz"]
[Board "${board}"]
[Dealer "N"]
[Vulnerable "None"]
[Deal "N:AK.QJ.T9.8765 Q.K.A.J 2.3.4.5 6.7.8.9"]
[Contract "3NT"]
[Result "9"]
{${comment}}
[Auction "N"]
1NT Pass 3NT AP
`

const PBN = ['% PBN 2.1', deal(1, 'pierwszy'), deal(2, 'drugi'), deal(3, 'trzeci')].join('\n')

const renderViewer = (url = '/pbn?filename=test.pbn') => {
    const router = createMemoryRouter([
        {path: '/', element: <div>home page</div>},
        {path: '/pbn', element: <PbnViewer/>},
    ], {initialEntries: [url]})
    render(<RouterProvider router={router}/>)
    return router
}

const currentBoard = () => document.querySelector('.DealNumber').textContent
const dealParam = router => new URLSearchParams(router.state.location.search).get('deal')

const openMenuItem = async name => {
    await userEvent.click(screen.getByRole('button', {name: 'Menu rozdania'}))
    await userEvent.click(screen.getByRole('menuitem', {name}))
}

const editComment = async text => {
    await openMenuItem('Edytuj rozdanie')
    await userEvent.clear(screen.getByRole('textbox', {name: 'Komentarz'}))
    await userEvent.type(screen.getByRole('textbox', {name: 'Komentarz'}), text)
    await userEvent.click(screen.getByRole('button', {name: 'Zapisz'}))
}

describe('PbnViewer', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn(async () => ({ok: true, text: async () => PBN})))
    })

    test('loads the file and shows the first deal', async () => {
        renderViewer()

        expect(await screen.findByText('pierwszy')).toBeInTheDocument()
        expect(fetch).toHaveBeenCalledWith('test.pbn')
        expect(currentBoard()).toBe('1.')
        expect(screen.getByRole('button', {name: 'Poprzednie'})).toBeDisabled()
    })

    test('opens the deal from the URL', async () => {
        renderViewer('/pbn?filename=test.pbn&deal=2')

        expect(await screen.findByText('drugi')).toBeInTheDocument()
    })

    test.each(['0', '99', 'abc'])('clamps an invalid deal parameter %j', async deal => {
        renderViewer(`/pbn?filename=test.pbn&deal=${deal}`)

        await screen.findByText('Mecz')
        expect(['1.', '3.']).toContain(currentBoard())
    })

    test('navigates with buttons, board numbers and arrow keys and keeps the deal in the URL', async () => {
        const router = renderViewer()
        await screen.findByText('pierwszy')

        await userEvent.click(screen.getByRole('button', {name: 'Następne'}))
        expect(screen.getByText('drugi')).toBeInTheDocument()
        expect(dealParam(router)).toBe('2')

        await userEvent.click(screen.getByRole('button', {name: '3'}))
        expect(screen.getByText('trzeci')).toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'Następne'})).toBeDisabled()

        await userEvent.keyboard('{ArrowLeft}')
        expect(screen.getByText('drugi')).toBeInTheDocument()
        expect(dealParam(router)).toBe('2')

        await userEvent.keyboard('{ArrowRight}')
        expect(dealParam(router)).toBe('3')
    })

    test('does not switch deals with arrow keys while editing a comment', async () => {
        renderViewer()
        await screen.findByText('pierwszy')

        await openMenuItem('Edytuj rozdanie')
        await userEvent.keyboard('{ArrowRight}')

        expect(currentBoard()).toBe('1.')
    })

    test('shows an error when the file cannot be loaded', async () => {
        fetch.mockResolvedValue({ok: false, status: 404})

        renderViewer('/pbn?filename=missing.pbn')

        expect(await screen.findByText('Nie udało się pobrać pliku missing.pbn (404)')).toBeInTheDocument()
    })

    test('downloads the PBN with the edited comment', async () => {
        const createObjectURL = vi.fn(() => 'blob:test')
        vi.stubGlobal('URL', Object.assign(URL, {createObjectURL, revokeObjectURL: vi.fn()}))
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
        })
        renderViewer()
        await screen.findByText('pierwszy')

        await editComment('poprawiony')
        expect(screen.getByRole('button', {name: 'Menu rozdania'})).toHaveAttribute('title', 'Są niepobrane zmiany w rozdaniach')
        await openMenuItem('Pobierz PBN *')

        expect(click).toHaveBeenCalled()
        const content = await createObjectURL.mock.calls[0][0].text()
        expect(content).toContain('{poprawiony}')
        expect(content).toContain('{drugi}')
        expect(content).not.toContain('{pierwszy}')
        expect(screen.getByRole('button', {name: 'Menu rozdania'})).not.toHaveAttribute('title')
        await userEvent.click(screen.getByRole('button', {name: 'Menu rozdania'}))
        expect(screen.getByRole('menuitem', {name: 'Pobierz PBN'})).toBeInTheDocument()
    })

    test('edits the auction and the contract of a deal and downloads them', async () => {
        const createObjectURL = vi.fn(() => 'blob:test')
        vi.stubGlobal('URL', Object.assign(URL, {createObjectURL, revokeObjectURL: vi.fn()}))
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
        })
        renderViewer()
        await screen.findByText('pierwszy')

        await openMenuItem('Edytuj rozdanie')
        await userEvent.click(screen.getByRole('button', {name: 'Wyczyść licytację'}))
        for (const call of ['1NT', 'Pass', '4S', 'Pass', 'Pass', 'Pass']) {
            await userEvent.click(screen.getByRole('button', {name: call}))
        }
        await userEvent.click(screen.getByRole('button', {name: 'Ustaw z licytacji'}))
        await userEvent.clear(screen.getByRole('spinbutton', {name: 'Lewy'}))
        await userEvent.type(screen.getByRole('spinbutton', {name: 'Lewy'}), '11')
        await userEvent.click(screen.getByRole('button', {name: 'Zapisz'}))

        expect(screen.getByText(/Kontrakt:/)).toHaveTextContent('Kontrakt: 4 S')
        await openMenuItem(/Pobierz PBN/)
        const content = await createObjectURL.mock.calls[0][0].text()
        expect(content).toContain('[Contract "4S"]\n[Result "11"]\n{pierwszy}\n[Declarer "S"]\n[Score "NS 450"]\n[Auction "N"]\n1NT Pass 4S Pass\nPass Pass')
    })

    test('highlights the hand whose call is entered while editing', async () => {
        renderViewer()
        await screen.findByText('pierwszy')
        expect(document.querySelector('.Hand.is-active')).toBeNull()

        await openMenuItem('Edytuj rozdanie')
        await userEvent.click(screen.getByRole('button', {name: 'Wyczyść licytację'}))
        expect(document.querySelector('.Hand.is-active')).toHaveClass('North')
        await userEvent.click(screen.getByRole('button', {name: '1C'}))
        expect(document.querySelector('.Hand.is-active')).toHaveClass('East')

        await userEvent.click(screen.getByRole('button', {name: 'Anuluj'}))
        expect(document.querySelector('.Hand.is-active')).toBeNull()
    })

    test('asks before leaving the page with edits that were not downloaded', async () => {
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
        const router = renderViewer()
        await screen.findByText('pierwszy')
        await editComment('poprawiony')

        await act(() => router.navigate('/'))
        expect(confirm).toHaveBeenCalledTimes(1)
        expect(router.state.location.pathname).toBe('/pbn')

        await userEvent.click(screen.getByRole('button', {name: 'Następne'}))
        expect(confirm).toHaveBeenCalledTimes(1)

        confirm.mockReturnValue(true)
        await act(() => router.navigate('/'))
        await waitFor(() => expect(screen.getByText('home page')).toBeInTheDocument())
    })

    test('warns on page unload only when there are edits', async () => {
        renderViewer()
        await screen.findByText('pierwszy')

        const unload = () => {
            const event = new Event('beforeunload', {cancelable: true})
            window.dispatchEvent(event)
            return event.defaultPrevented
        }
        expect(unload()).toBe(false)

        await editComment('poprawiony')
        expect(unload()).toBe(true)
    })
})

describe('PbnViewer filters', () => {
    const RESULTS_PBN = ['% PBN 2.1', deal(1, 'WYNIK: +5'), deal(2, 'WYNIK: -7'), deal(3, ''), deal(4, 'WYNIK: 30%'),
        deal(5, 'bez wyniku')].join('\n').replace('{}', '')

    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn(async () => ({ok: true, text: async () => RESULTS_PBN})))
    })

    const boardButtons = () => [...document.querySelectorAll('.App-deal-boards button')].map(b => b.textContent)

    test('colours the board buttons by our result', async () => {
        renderViewer()
        await screen.findByText('WYNIK: +5')

        expect(screen.getByRole('button', {name: '1'})).toHaveClass('is-success')
        expect(screen.getByRole('button', {name: '2'})).toHaveClass('is-danger')
        expect(screen.getByRole('button', {name: '2'})).toHaveAttribute('title', '-7 IMP')
        expect(screen.getByRole('button', {name: '4'})).toHaveClass('is-danger')
        expect(screen.getByRole('button', {name: '5'})).not.toHaveClass('is-danger', 'is-success')
    })

    test('shows only commented deals', async () => {
        const router = renderViewer()
        await screen.findByText('WYNIK: +5')

        await userEvent.click(screen.getByRole('checkbox', {name: 'Tylko z komentarzem'}))

        expect(boardButtons()).toEqual(['1', '2', '4', '5'])
        expect(screen.getByText('4 z 5 rozdań')).toBeInTheDocument()
        expect(new URLSearchParams(router.state.location.search).get('filter')).toBe('komentarz')
    })

    test('shows only our losses, jumps to the first one and skips the others when navigating', async () => {
        const router = renderViewer()
        await screen.findByText('WYNIK: +5')

        await userEvent.click(screen.getByRole('checkbox', {name: 'Tylko nasze straty'}))
        expect(boardButtons()).toEqual(['2', '4'])
        expect(currentBoard()).toBe('2.')

        await userEvent.click(screen.getByRole('button', {name: 'Następne'}))
        expect(currentBoard()).toBe('4.')
        expect(screen.getByRole('button', {name: 'Następne'})).toBeDisabled()
        await userEvent.keyboard('{ArrowLeft}')
        expect(currentBoard()).toBe('2.')
        expect(dealParam(router)).toBe('2')
    })

    test('keeps the filters from the URL', async () => {
        renderViewer('/pbn?filename=test.pbn&deal=4&filter=straty')
        await screen.findByText('WYNIK: 30%')

        expect(screen.getByRole('checkbox', {name: 'Tylko nasze straty'})).toBeChecked()
        expect(boardButtons()).toEqual(['2', '4'])
    })

    test('says when no deal matches', async () => {
        fetch.mockResolvedValue({ok: true, text: async () => ['% PBN 2.1', deal(1, 'WYNIK: +1')].join('\n')})
        renderViewer('/pbn?filename=test.pbn&filter=straty')
        await screen.findByText('WYNIK: +1')

        expect(screen.getByText('Brak rozdań spełniających filtr.')).toBeInTheDocument()
    })
})

describe('PbnViewer hidden hands', () => {
    const NAMED_PBN = ['% PBN 2.1', `[Event "Mecz"]
[Board "1"]
[West "Bartek"]
[North ""]
[East "Marek"]
[South ""]
[Dealer "N"]
[Vulnerable "None"]
[Deal "N:AK.QJ.T9.8765 Q.K.A.J 2.3.4.5 6.7.8.9"]
[Contract "3NT"]
[Result "9"]
{WYNIK: -6}
[Auction "N"]
1NT Pass 3NT AP
[Play "E"]
SQ
[Minimax "3NN400"]`, deal(2, 'WYNIK: +3')].join('\n')

    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn(async () => ({ok: true, text: async () => NAMED_PBN})))
    })

    test('shows only the hand of the chosen player and nothing that gives the result away', async () => {
        const router = renderViewer()
        await screen.findByText('WYNIK: -6')

        await userEvent.click(screen.getByRole('button', {name: 'widzę rękę: Bartek'}))

        expect(new URLSearchParams(router.state.location.search).get('zakryj')).toBe('BB')
        expect(screen.getByText(/Widzisz tylko rękę Bartka \(W\)/)).toBeInTheDocument()
        expect(document.querySelectorAll('.HiddenHand')).toHaveLength(3)
        expect(document.querySelector('.West .HiddenHand')).toBeNull()
        expect(screen.queryByText('WYNIK: -6')).toBeNull()
        expect(screen.queryByText(/Result \(tricks\)/)).toBeNull()
        expect(document.querySelector('.Minimax')).toBeNull()
        expect(document.querySelector('.PlayControls')).toBeNull()
        expect(screen.getByRole('button', {name: '1'})).not.toHaveClass('is-danger')
        // the auction is revealed step by step, starting before the first call of W
        expect(screen.getByText('Twoja kolej – co mówisz?')).toBeInTheDocument()
        expect([...document.querySelectorAll('.App-bidTable td')].map(td => td.textContent)).toEqual(['1NT', 'pas', '3NT', '?'])
    })

    test('reveals the current deal and covers the next one again', async () => {
        renderViewer('/pbn?filename=test.pbn&zakryj=MJ')
        await screen.findByText(/Widzisz tylko rękę Marka \(E\)/)

        await userEvent.click(screen.getByRole('button', {name: 'Odkryj rozdanie'}))
        expect(document.querySelectorAll('.HiddenHand')).toHaveLength(0)
        expect(screen.getByText('WYNIK: -6')).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', {name: 'Następne'}))
        // the second deal has no names: all hands are shown with a note
        expect(screen.getByText(/W tym rozdaniu nie ma Marka/)).toBeInTheDocument()
        await userEvent.click(screen.getByRole('button', {name: 'Poprzednie'}))
        expect(document.querySelectorAll('.HiddenHand')).toHaveLength(3)
    })

    test('turns off', async () => {
        const router = renderViewer('/pbn?filename=test.pbn&zakryj=BB')
        await screen.findByText(/Widzisz tylko rękę Bartka/)

        await userEvent.click(screen.getByRole('button', {name: 'wył.'}))

        expect(router.state.location.search).not.toContain('zakryj')
        expect(screen.getByText('WYNIK: -6')).toBeInTheDocument()
    })

    test('shows the summary of the matches of a team event and opens a segment from it', async () => {
        const file = '3liga_2026-2027_runda5-6.pbn'
        const text = fs.readFileSync(path.join(import.meta.dirname, '../../public', file), 'utf8')
        fetch.mockResolvedValue({ok: true, text: async () => text})
        const router = renderViewer(`/pbn?filename=${file}`)

        expect(await screen.findByText(/Pierwszy zjazd III ligi – podsumowanie/)).toBeInTheDocument()
        expect(screen.getByText('53 : 33 IMP')).toBeInTheDocument()
        expect(screen.getByText(/CKiS Skawina – CKiS IV Skawina/)).toBeInTheDocument()

        const segments = screen.getAllByRole('button', {name: /^rozdania/})
        expect(segments.map(button => button.textContent)).toEqual(['rozdania 1-10', 'rozdania 11-20', 'rozdania 1-20'])
        await userEvent.click(segments[2])

        expect(dealParam(router)).toBe('21')
    })

    test('shows the opening lead under the auction', async () => {
        const file = '3liga_2026-2027_runda5-6.pbn'
        const text = fs.readFileSync(path.join(import.meta.dirname, '../../public', file), 'utf8')
        fetch.mockResolvedValue({ok: true, text: async () => text})
        renderViewer(`/pbn?filename=${file}`)

        // board 1 of round 5: 3H by S, W led the king of clubs
        const lead = await screen.findByText(/Wist:/)
        expect(lead).toHaveTextContent('Wist: K (W)')
        expect(lead.querySelector('img')).toHaveAttribute('alt', 'C')
    })

    test('shows no summary for other files', async () => {
        fetch.mockResolvedValue({ok: true, text: async () => PBN})
        renderViewer()

        await screen.findByText('pierwszy')
        expect(screen.queryByText(/podsumowanie/)).not.toBeInTheDocument()
    })
})
