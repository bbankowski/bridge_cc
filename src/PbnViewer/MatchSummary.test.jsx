import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {expect, test, vi} from 'vitest'
import MatchSummary from './MatchSummary'

const tournament = {
    name: 'Zjazd ligi', team: 'Nasi',
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
    render(<MatchSummary tournament={tournament} deals={deals} onSelectDeal={() => {}}/>)

    expect(screen.getByText('Zjazd ligi – podsumowanie')).toBeInTheDocument()
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
    render(<MatchSummary tournament={tournament} deals={deals} onSelectDeal={onSelectDeal}/>)

    await userEvent.click(screen.getByRole('button', {name: 'rozdania 7-8'}))

    expect(onSelectDeal).toHaveBeenCalledWith(2)
})

test('is collapsed by default', () => {
    const {container} = render(<MatchSummary tournament={tournament} deals={deals} onSelectDeal={() => {}}/>)

    expect(container.querySelector('details')).not.toHaveAttribute('open')
})

test('shows the open room first and the closed one next to it, marking our table', () => {
    const closedOurs = {...tournament, matches: [{...tournament.matches[0], segments: [{
        ...tournament.matches[0].segments[0],
        ourTable: {...tournament.matches[0].segments[0].ourTable, room: 'zamknięty'},
        otherTable: {...tournament.matches[0].segments[0].otherTable, room: 'otwarty'},
    }]}]}
    render(<MatchSummary tournament={closedOurs} deals={deals} onSelectDeal={() => {}}/>)

    const rooms = [...document.querySelectorAll('.MatchSummary-room')]
    expect(rooms.map(room => room.querySelector('.MatchSummary-roomName').textContent))
        .toEqual(['Pokój otwarty', 'Pokój zamknięty (nasz stół)'])
    expect(rooms[1]).toHaveTextContent('EW Marek Jarosz – Bartosz Bańkowski')
    expect(rooms[0]).toHaveTextContent('NS Celina C – Dorota D')
})
