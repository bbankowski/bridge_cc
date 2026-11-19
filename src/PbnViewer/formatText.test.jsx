import {render} from '@testing-library/react'
import {expect, test} from 'vitest'
import {formatText} from './formatText'

test('replaces suit escapes with icons', () => {
    const {container, getByAltText} = render(<p>{formatText('wist \\S8 i \\HK')}</p>)

    expect(container).toHaveTextContent('wist 8 i K')
    expect(getByAltText('S')).toBeInTheDocument()
    expect(getByAltText('H')).toBeInTheDocument()
})

test('drops literal \\n sequences and keeps real line breaks', () => {
    const {container} = render(<p>{formatText('a\\nb\nc')}</p>)

    expect(container.textContent).toBe('ab\nc')
})

test('handles a missing text', () => {
    const {container} = render(<p>{formatText(undefined)}</p>)

    expect(container.textContent).toBe('')
})
