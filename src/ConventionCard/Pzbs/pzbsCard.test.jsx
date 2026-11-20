import {render, screen} from '@testing-library/react'
import {createMemoryRouter, RouterProvider} from 'react-router'
import {describe, expect, test} from 'vitest'
import data from '../../../karta-pzbs.json'
import {OpeningsPage, OutsidePage} from './FullCard'
import PzbsCardPage from './PzbsCardPage'
import {LEAD_ROWS, missingFields} from './pzbsCard'

const OPENINGS = ['1♣', '1♦', '1♥', '1♠', '1BA', '2♣', '2♦', '2♥', '2♠', '2BA', '3♣', '3♦', '3♥', '3♠', '3BA', '4♣', '4♦']

describe('karta-pzbs.json', () => {
    test('has every opening row of the PZBS form in order', () => {
        expect(data.otwarcia.map(o => o.otwarcie)).toEqual(OPENINGS)
    })

    test('has every lead row', () => {
        expect(Object.keys(data.wisty.wyjscia).sort()).toEqual(LEAD_ROWS.map(([key]) => key).sort())
    })
})

describe('missingFields', () => {
    test('is empty for the current card', () => {
        expect(missingFields(data)).toEqual([])
    })

    test('is empty for a complete card', () => {
        const leads = Object.fromEntries(LEAD_ROWS.map(([key]) => [key, {kolor: 'x', ba: 'x'}]))
        const complete = {
            ...data,
            naglowek: {...data.naglowek, kategoria: 'II', zawody: 'Liga'},
            otwarcia: data.otwarcia.map(o => ({sztuczna: false, minKart: '6', opis: 'x', odpowiedzi: 'x', ...Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null))})),
            wisty: {...data.wisty, wyjscia: leads, sygnaly: {doWyjsciaPartnera: 'x', doWyjsciaRozgrywajacego: 'x', doInnegoKoloru: 'x'}},
        }
        expect(missingFields(complete)).toEqual([])
    })
})

test('the inside page has the openings table with the slam conventions', () => {
    const {container} = render(<OpeningsPage data={data}/>)

    const rows = [...container.querySelectorAll('tbody tr')]
    expect(rows.map(row => row.querySelector('td').textContent)).toEqual(OPENINGS)
    expect(rows[0]).toHaveTextContent('12-14 PC skład równy')
    expect(rows[0].querySelectorAll('td')[1]).toHaveTextContent('X')
    expect(screen.getByText('KONWENCJE STREFY SZLEMOWEJ').closest('td')).toHaveAttribute('rowspan', '6')
})

test('the outside page has the competitive bidding, leads, doubles and the cover', () => {
    render(<OutsidePage data={data}/>)

    for (const heading of ['WEJŚCIE 1BA', 'PRZECIW ZAPORÓWKOM', 'SYGNAŁY UPORZĄDKOWANE POD WZGLĘDEM WAŻNOŚCI',
        'KONTRY WYWOŁAWCZE', 'OPIS OGÓLNY', 'ODZYWKI PSYCHOLOGICZNE']) {
        expect(screen.getByText(heading)).toBeInTheDocument()
    }
    expect([...document.querySelectorAll('.PzbsCard-leads tbody td:first-child')].map(td => td.textContent))
        .toEqual(['w asa', 'w króla', 'w damę', 'w waleta', '10', '9', 'w wysoką x', 'w niską x'])
    expect(screen.getByText(/Bartosz Bańkowski \(PID 13886\)/)).toBeInTheDocument()
    expect(screen.getByText(/zrzutka krakowska/)).toBeInTheDocument()
})

test('the page shows both pages and nothing to fill in', () => {
    render(<RouterProvider router={createMemoryRouter([{path: '/', element: <PzbsCardPage/>}])}/>)

    expect(document.querySelectorAll('.PzbsCard-page')).toHaveLength(2)
    expect(screen.queryByText(/Do uzupełnienia/)).toBeNull()
    expect(screen.getByRole('button', {name: 'Drukuj / zapisz PDF'})).toBeInTheDocument()
})
