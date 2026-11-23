import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {expect, test, vi} from 'vitest'
import DealMenu from './DealMenu'

const renderMenu = (props = {}) => {
    const handlers = {onEdit: vi.fn(), onDownload: vi.fn()}
    render(<div><span>poza menu</span><DealMenu canEdit isModified={false} {...handlers} {...props}/></div>)
    return handlers
}
const toggle = () => userEvent.click(screen.getByRole('button', {name: 'Menu rozdania'}))

test('opens with the "⋮" button and runs the chosen item', async () => {
    const {onEdit, onDownload} = renderMenu()
    expect(screen.queryByRole('menu')).toBeNull()

    await toggle()
    await userEvent.click(screen.getByRole('menuitem', {name: 'Edytuj rozdanie'}))
    expect(onEdit).toHaveBeenCalled()
    expect(screen.queryByRole('menu')).toBeNull()

    await toggle()
    await userEvent.click(screen.getByRole('menuitem', {name: 'Pobierz PBN'}))
    expect(onDownload).toHaveBeenCalled()
})

test.each([
    ['a click outside', () => userEvent.click(screen.getByText('poza menu'))],
    ['Esc', () => userEvent.keyboard('{Escape}')],
])('closes with %s', async (_, close) => {
    renderMenu()
    await toggle()

    await close()

    expect(screen.queryByRole('menu')).toBeNull()
})

test('marks edits that were not downloaded and disables editing when it is not possible', async () => {
    renderMenu({canEdit: false, isModified: true})

    expect(screen.getByRole('button', {name: 'Menu rozdania'})).toHaveAttribute('title', 'Są niepobrane zmiany w rozdaniach')
    await toggle()
    expect(screen.getByRole('menuitem', {name: 'Edytuj rozdanie'})).toBeDisabled()
    expect(screen.getByRole('menuitem', {name: 'Pobierz PBN *'})).toBeEnabled()
})
