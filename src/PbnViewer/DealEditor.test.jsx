import {useState} from 'react'
import {render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, test, vi} from 'vitest'
import DealEditor from './DealEditor'
import {parsePbn} from './pbn'

const pbnDeal = ({comment = 'Wist w \\S8', auction = '', contract = '3NT', declarer = 'S', result = '9'} = {}) =>
    parsePbn(`[Event "Mecz"]
[Board "1"]
[Dealer "N"]
[Vulnerable "NS"]
[Deal "N:AK.QJ.T9.8765 Q.K.A.J 2.3.4.5 6.7.8.9"]
[Declarer "${declarer}"]
[Contract "${contract}"]
[Result "${result}"]
{${comment}}
${auction}`).deals[0]

// the editor is opened from the menu of the deal; here from a plain button
const Harness = ({deal, onSave}) => {
    const [editing, setEditing] = useState(false)
    return <>
        <button onClick={() => setEditing(true)}>Edytuj rozdanie</button>
        <DealEditor deal={deal} editing={editing} onSave={onSave} onClose={() => setEditing(false)}/>
    </>
}

const renderEditor = deal => {
    const onSave = vi.fn()
    render(<Harness deal={deal} onSave={onSave}/>)
    return onSave
}

const comment = () => screen.getByRole('textbox', {name: 'Komentarz'})
const edit = () => userEvent.click(screen.getByRole('button', {name: 'Edytuj rozdanie'}))
const bid = call => userEvent.click(screen.getByRole('button', {name: call}))

describe('DealEditor', () => {
    test('shows the formatted comment until the deal is edited', async () => {
        renderEditor(pbnDeal())

        expect(screen.queryByRole('textbox')).toBeNull()
        expect(screen.getByAltText('S')).toBeInTheDocument()

        await edit()

        expect(comment()).toHaveValue('Wist w \\S8')
        expect(comment()).toHaveFocus()
    })

    test('saves only the comment when nothing else was changed', async () => {
        const onSave = renderEditor(pbnDeal({comment: 'abc'}))
        await edit()

        await userEvent.type(comment(), ' def')
        await userEvent.click(screen.getByRole('button', {name: 'Zapisz'}))

        expect(onSave).toHaveBeenCalledWith({auctionLines: null, commentText: 'abc def'})
        expect(screen.queryByRole('textbox')).toBeNull()
    })

    test('saves with Ctrl+Enter', async () => {
        const onSave = renderEditor(pbnDeal({comment: 'abc'}))
        await edit()

        await userEvent.type(comment(), '!{Control>}{Enter}{/Control}')

        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({commentText: 'abc!'}))
    })

    test.each([
        ['"Anuluj"', () => userEvent.click(screen.getByRole('button', {name: 'Anuluj'}))],
        ['Esc', () => userEvent.keyboard('{Escape}')],
    ])('discards changes with %s', async (_, cancel) => {
        const onSave = renderEditor(pbnDeal({comment: 'abc'}))
        await edit()
        await userEvent.type(comment(), ' def')

        await cancel()

        expect(onSave).not.toHaveBeenCalled()
        expect(screen.queryByRole('textbox')).toBeNull()
        expect(screen.getByText('abc')).toBeInTheDocument()
    })

    test('enters the auction on the bidding box, with an alert, and saves it', async () => {
        const onSave = renderEditor(pbnDeal())
        await edit()

        expect(screen.getByText('Odzywka N:')).toBeInTheDocument()
        await bid('1C')
        await userEvent.type(screen.getByRole('textbox', {name: /Alert/}), '16+ PC')
        await bid('Pass')
        await bid('1NT')
        // a call that is not legal is disabled
        expect(screen.getByRole('button', {name: '1S'})).toBeDisabled()
        await bid('Pass')
        await bid('3NT')
        await bid('Pass')
        await bid('Pass')
        await bid('Pass')

        expect(screen.getByText('Licytacja zakończona.')).toBeInTheDocument()
        expect(screen.getByRole('button', {name: '7NT'})).toBeDisabled()
        expect(screen.getByText('1: 16+ PC')).toBeInTheDocument()
        await userEvent.click(screen.getByRole('button', {name: 'Zapisz'}))

        expect(onSave).toHaveBeenCalledWith({
            auctionLines: ['[Auction "N"]', '1C =1= Pass 1NT Pass', '3NT Pass Pass Pass', '[Note "1:16+ PC"]'],
            commentText: 'Wist w \\S8',
        })
    })

    test('starts from the auction of the deal and undoes the last call', async () => {
        const onSave = renderEditor(pbnDeal({auction: '[Auction "N"]\n1NT Pass 3NT AP'}))
        await edit()

        for (let i = 0; i < 3; i++) {
            await userEvent.click(screen.getByRole('button', {name: 'Cofnij odzywkę'}))
        }
        // W doubles 3NT
        await bid('X')
        await userEvent.click(screen.getByRole('button', {name: 'Zapisz'}))

        expect(onSave.mock.calls[0][0].auctionLines).toEqual(['[Auction "N"]', '1NT Pass 3NT X'])
    })

    test('sets the contract and the result, and computes the score', async () => {
        const onSave = renderEditor(pbnDeal({contract: '', declarer: '', result: ''}))
        await edit()

        await userEvent.selectOptions(screen.getByRole('combobox', {name: 'Wysokość'}), '4')
        await userEvent.selectOptions(screen.getByRole('combobox', {name: 'Miano'}), 'S')
        await userEvent.selectOptions(screen.getByRole('combobox', {name: 'Kontra'}), 'X')
        await userEvent.selectOptions(screen.getByRole('combobox', {name: 'Rozgrywający'}), 'W')
        await userEvent.type(screen.getByRole('spinbutton', {name: 'Lewy'}), '8')

        // EW not vulnerable, 4SX-2: 300 for NS
        expect(screen.getByText(/Zapis: NS 300/)).toBeInTheDocument()
        await userEvent.click(screen.getByRole('button', {name: 'Zapisz'}))

        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
            contract: '4SX', declarer: 'W', result: '8', score: 'NS 300',
        }))
    })

    test('offers the contract of the auction when it differs', async () => {
        const onSave = renderEditor(pbnDeal({contract: '3NT', declarer: 'N', result: '10'}))
        await edit()
        for (const call of ['1C', 'Pass', '1H', 'Pass', '4H', 'Pass', 'Pass', 'Pass']) {
            await bid(call)
        }

        expect(screen.getByText('z licytacji wychodzi 4H S')).toBeInTheDocument()
        await userEvent.click(screen.getByRole('button', {name: 'Ustaw z licytacji'}))

        expect(screen.queryByText(/z licytacji wychodzi/)).toBeNull()
        // NS vulnerable, 4H= by S
        expect(screen.getByText(/Zapis: NS 620/)).toBeInTheDocument()
        await userEvent.click(screen.getByRole('button', {name: 'Zapisz'}))
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({contract: '4H', declarer: 'S', score: 'NS 620'}))
    })

    test('shows the auction being entered in the auction table', async () => {
        renderEditor(pbnDeal())
        await edit()
        await bid('2D')

        const table = screen.getByRole('table')
        expect(within(table).getAllByRole('row')).toHaveLength(2)
    })
})
