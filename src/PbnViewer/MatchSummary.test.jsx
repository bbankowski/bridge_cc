import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {expect, test, vi} from 'vitest'
import MatchSummary from './MatchSummary'

const summary = {
    team: 'Nasi',
    matches: [{
        title: 'Runda 1', opponent: 'Rywale', imps: [30, 12], vp: [15.5, 4.5],
        segments: [{
            deals: [3, 4],
            ourTable: {room: 'otwarty', ns: ['Anna A', 'Beata B'], ew: ['Marek Jarosz', 'Bartosz Bańkowski'], ours: 'ew'},
            otherTable: {room: 'zamknięty', ns: ['Celina C', 'Dorota D'], ew: ['Ewa E', 'Fryderyk F'], ours: 'ns'},
        }],
    }],
}
const deals = [{board: '1'}, {board: '2'}, {board: '7'}, {board: '8'}]

test('shows the matches with their scores and who sat where', () => {
    render(<MatchSummary summary={summary} deals={deals} onSelectDeal={() => {}}/>)

    expect(screen.getByText('Podsumowanie meczów')).toBeInTheDocument()
    expect(screen.getByText(/Nasi – Rywale/)).toBeInTheDocument()
    expect(screen.getByText('30 : 12 IMP')).toHaveClass('is-success')
    expect(screen.getByText('15,5 : 4,5 VP')).toBeInTheDocument()
    // our pairs are bold at both tables
    expect(screen.getByText('Marek Jarosz – Bartosz Bańkowski').tagName).toBe('STRONG')
    expect(screen.getByText('Celina C – Dorota D').tagName).toBe('STRONG')
    expect(screen.getByText(/Anna A – Beata B/).tagName).not.toBe('STRONG')
})

test('names a segment by its board numbers and opens its first deal', async () => {
    const onSelectDeal = vi.fn()
    render(<MatchSummary summary={summary} deals={deals} onSelectDeal={onSelectDeal}/>)

    await userEvent.click(screen.getByRole('button', {name: 'rozdania 7-8'}))

    expect(onSelectDeal).toHaveBeenCalledWith(2)
})

test('is collapsed by default', () => {
    const {container} = render(<MatchSummary summary={summary} deals={deals} onSelectDeal={() => {}}/>)

    expect(container.querySelector('details')).not.toHaveAttribute('open')
})

test('shows the deals of each segment and then the open and the closed room in columns, marking our table', () => {
    const closedOurs = {...summary, matches: [{...summary.matches[0], segments: [{
        ...summary.matches[0].segments[0],
        ourTable: {...summary.matches[0].segments[0].ourTable, room: 'zamknięty'},
        otherTable: {...summary.matches[0].segments[0].otherTable, room: 'otwarty'},
    }]}]}
    render(<MatchSummary summary={closedOurs} deals={deals} onSelectDeal={() => {}}/>)

    expect([...document.querySelectorAll('.MatchSummary-grid > .MatchSummary-roomName')].map(header => header.textContent))
        .toEqual(['Pokój otwarty', 'Pokój zamknięty (nasz stół)'])
    // a row: the deals of the segment, then the open and the closed room
    const row = [...document.querySelector('.MatchSummary-grid').children].slice(3)
    expect(row[0]).toHaveTextContent('rozdania 7-8')
    expect(row[1]).toHaveTextContent('NS Celina C – Dorota D')
    expect(row[2]).toHaveTextContent('EW Marek Jarosz – Bartosz Bańkowski')
})
