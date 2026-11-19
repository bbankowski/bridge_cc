import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, test, vi} from 'vitest'
import CommentEditor from './CommentEditor'

const renderEditor = (commentText = 'Wist w \\S8') => {
    const onSave = vi.fn()
    render(<CommentEditor commentText={commentText} onSave={onSave}/>)
    return onSave
}

describe('CommentEditor', () => {
    test('shows the formatted comment until "Edytuj" is clicked', async () => {
        renderEditor()

        expect(screen.queryByRole('textbox')).toBeNull()
        expect(screen.getByAltText('S')).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', {name: 'Edytuj'}))

        expect(screen.getByRole('textbox')).toHaveValue('Wist w \\S8')
        expect(screen.getByRole('textbox')).toHaveFocus()
        expect(screen.queryByRole('button', {name: 'Edytuj'})).toBeNull()
    })

    test('saves the edited text with "Zapisz"', async () => {
        const onSave = renderEditor('abc')
        await userEvent.click(screen.getByRole('button', {name: 'Edytuj'}))

        await userEvent.type(screen.getByRole('textbox'), ' def')
        await userEvent.click(screen.getByRole('button', {name: 'Zapisz'}))

        expect(onSave).toHaveBeenCalledWith('abc def')
        expect(screen.queryByRole('textbox')).toBeNull()
    })

    test('saves with Ctrl+Enter', async () => {
        const onSave = renderEditor('abc')
        await userEvent.click(screen.getByRole('button', {name: 'Edytuj'}))

        await userEvent.type(screen.getByRole('textbox'), '!{Control>}{Enter}{/Control}')

        expect(onSave).toHaveBeenCalledWith('abc!')
    })

    test.each([
        ['"Anuluj"', () => userEvent.click(screen.getByRole('button', {name: 'Anuluj'}))],
        ['Esc', () => userEvent.keyboard('{Escape}')],
    ])('discards changes with %s', async (_, cancel) => {
        const onSave = renderEditor('abc')
        await userEvent.click(screen.getByRole('button', {name: 'Edytuj'}))
        await userEvent.type(screen.getByRole('textbox'), ' def')

        await cancel()

        expect(onSave).not.toHaveBeenCalled()
        expect(screen.queryByRole('textbox')).toBeNull()
        expect(screen.getByText('abc')).toBeInTheDocument()
    })
})
