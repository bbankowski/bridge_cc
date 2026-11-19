import fs from 'node:fs'
import path from 'node:path'
import {render, screen, within} from '@testing-library/react'
import {createMemoryRouter, RouterProvider} from 'react-router'
import {describe, expect, test} from 'vitest'
import data from '../../../karta-pzbs.json'
import MiniCard from './MiniCard'
import PzbsCardPage from './PzbsCardPage'
import {defenceAfter1NT, missingFields} from './pzbsCard'

const biddingText = fs.readFileSync(path.join(import.meta.dirname, '../../../bidding.txt'), 'utf8')

describe('defenceAfter1NT', () => {
    test('reads the defence after 1NT from the section of bidding.txt', () => {
        expect(defenceAfter1NT(biddingText, data.obronaPo1BA.sekcja)).toEqual([
            {label: 'Kontra', description: '5 mlodsza, 4 starsza'},
            {label: '2♣', description: '54 kolory stare'},
            {label: '2♦', description: '6+ w starym'},
            {label: '2♥', description: '5+ mlody, 5+ kierów'},
            {label: '2♠', description: '5+ mlody, 5+ pików'},
            {label: '2BA', description: '55 w kolorach mlodych'},
        ])
    })

    test('returns null for an unknown section', () => {
        expect(defenceAfter1NT(biddingText, 'Nie ma takiej')).toBeNull()
    })
})

test('missingFields lists the empty fields', () => {
    const full = {...data, system: {wybor: 'inny'}, blefy: 'rzadko', kontraNaOtwarcie1wKolor: {przedPasem: 'wywolawcza', poPasie: 'wywolawcza'},
        wejscie1BANaWygasajacej: '12-15', kontraNegatywna: {po1wKolor: '3♠', po1BA: '2♠'}, odwrotka: 'brak',
        po1BAktr2H: 'transfer', wist: 'naturalny', zrzutki: ['lavinthal']}

    expect(missingFields(full)).toEqual([])
    expect(missingFields({...full, wist: null, zrzutki: []})).toEqual(['Wist', 'Zrzutki'])
})

describe('MiniCard', () => {
    const renderCard = (overrides = {}) => render(<MiniCard data={{...data, ...overrides}} defence={defenceAfter1NT(biddingText, data.obronaPo1BA.sekcja)}/>)
    const checked = () => [...document.querySelectorAll('.MiniCard-box')]
        .filter(box => box.querySelector('.MiniCard-check').textContent === '☒').map(box => box.textContent.slice(2))

    test('ticks the choices of karta-pzbs.json', () => {
        renderCard()

        expect(checked()).toEqual(['Wspólny Język', '4+♦', 'silne', 'Precision', 'Multi', '5♥ - 5', '5♠ - 5', '5♣ - 5♦',
            'rzadko', 'wywoł.', 'wywoł.', 'naturalne', '9-14 PC', 'z damą atu', '5 asów', 'tak', 'tak', 'tak',
            'odmienny', 'odwrotne', 'Lavinthal'])
        expect(screen.getByText('Bartosz Bańkowski (PID 13886) – Marek Jarosz (PID 10237)')).toBeInTheDocument()
        expect(screen.getByText('pierwszy wist; później jakościowo odwrotny')).toBeInTheDocument()
        expect(screen.getByText('54 kolory stare')).toBeInTheDocument()
    })

    test('ticks lists and leaves empty fields with dots', () => {
        renderCard({zrzutki: ['lavinthal', 'ilosciowe'], wist: 'naturalny', kontraNegatywna: {po1wKolor: null, po1BA: '2♠'}})

        expect(checked()).toEqual(expect.arrayContaining(['naturalny', 'ilościowe', 'Lavinthal']))
        expect(document.querySelectorAll('.MiniCard-dots').length).toBeGreaterThan(0)
    })
})

test('the page shows two copies and the fields to fill in', () => {
    render(<RouterProvider router={createMemoryRouter([{path: '/', element: <PzbsCardPage/>}])}/>)

    expect(document.querySelectorAll('.MiniCard')).toHaveLength(2)
    const missing = within(screen.getByText(/Do uzupełnienia/).closest('.notification'))
    expect(missing.getAllByRole('listitem').map(item => item.textContent)).toEqual([
        'Kontra negatywna do poziomu – po otwarciu 1 w kolor', 'Odwrotka', 'W sekwencji 1BA (ktr) 2♥'])
    expect(screen.getByRole('button', {name: 'Drukuj / zapisz PDF'})).toBeInTheDocument()
})
