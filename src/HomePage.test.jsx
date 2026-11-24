import fs from 'node:fs'
import path from 'node:path'
import {render, screen} from '@testing-library/react'
import {createMemoryRouter, RouterProvider} from 'react-router'
import {afterEach, expect, test, vi} from 'vitest'
import HomePage from './HomePage'

const publicDir = path.join(import.meta.dirname, '../public')
const TOURNAMENTS = JSON.parse(fs.readFileSync(path.join(publicDir, 'tournaments.json'), 'utf8'))

const renderHomePage = () => {
    const router = createMemoryRouter([{path: '/', element: <HomePage/>}])
    render(<RouterProvider router={router}/>)
}

afterEach(() => {
    vi.unstubAllGlobals()
})

test('links every tournament of tournaments.json to the PBN viewer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ok: true, json: async () => TOURNAMENTS})))
    renderHomePage()

    expect(await screen.findByRole('link', {name: TOURNAMENTS[0].name})).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('tournaments.json')
    for (const {file, name} of TOURNAMENTS) {
        expect(screen.getByRole('link', {name})).toHaveAttribute('href', `/pbn?filename=${file}`)
    }
    expect(screen.getByRole('link', {name: 'BB i MJ'})).toHaveAttribute('href', '/cc')
})

test('tells when the list of tournaments cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ok: false, status: 404})))
    renderHomePage()

    expect(await screen.findByText('Nie udało się pobrać listy turniejów (404)')).toBeInTheDocument()
})

test.each(TOURNAMENTS.map(tournament => [tournament.file, tournament]))('tournaments.json: %s has a name and is in public/',
    (file, {name}) => {
        expect(name).toEqual(expect.any(String))
        expect(fs.existsSync(path.join(publicDir, file))).toBe(true)
    })
