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

const editComment = async text => {
    await userEvent.click(screen.getByRole('button', {name: 'Edytuj'}))
    await userEvent.clear(screen.getByRole('textbox'))
    await userEvent.type(screen.getByRole('textbox'), text)
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

        await userEvent.click(screen.getByRole('button', {name: 'Edytuj'}))
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
        const downloadButton = screen.getByRole('button', {name: /Pobierz PBN/})
        expect(downloadButton).toHaveTextContent('Pobierz PBN *')
        await userEvent.click(downloadButton)

        expect(click).toHaveBeenCalled()
        const content = await createObjectURL.mock.calls[0][0].text()
        expect(content).toContain('{poprawiony}')
        expect(content).toContain('{drugi}')
        expect(content).not.toContain('{pierwszy}')
        expect(downloadButton).toHaveTextContent(/^Pobierz PBN$/)
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
