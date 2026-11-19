import fs from 'node:fs'
import path from 'node:path'
import {render, screen} from '@testing-library/react'
import {createMemoryRouter, RouterProvider} from 'react-router'
import {expect, test} from 'vitest'
import HomePage from './HomePage'
import {TOURNAMENTS} from './tournaments'

test('links every tournament to the PBN viewer', () => {
    const router = createMemoryRouter([{path: '/', element: <HomePage/>}])
    render(<RouterProvider router={router}/>)

    for (const {file, name} of TOURNAMENTS) {
        expect(screen.getByRole('link', {name})).toHaveAttribute('href', `/pbn?filename=${file}`)
    }
    expect(screen.getByRole('link', {name: 'BB i MJ'})).toHaveAttribute('href', '/cc')
})

test('lists exactly the PBN files in public/', () => {
    const publicFiles = fs.readdirSync(path.join(import.meta.dirname, '../public')).filter(f => f.endsWith('.pbn'))

    expect(TOURNAMENTS.map(t => t.file).sort()).toEqual(publicFiles.sort())
})
