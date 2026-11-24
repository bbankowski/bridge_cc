import {Fragment} from 'react'

const formatVp = vp => vp.toLocaleString('pl-PL', {maximumFractionDigits: 2})

const Pair = ({names, ours}) => ours ? <strong>{names.join(' – ')}</strong> : names.join(' – ')

const ROOMS = ['otwarty', 'zamknięty']

// The pairs of one room in a segment, our team in bold. The name of the room is repeated in the cell on narrow screens.
const RoomCell = ({table}) => <div className="MatchSummary-cell">
    <p className="MatchSummary-cellRoom">Pokój {table.room}</p>
    <p><span className="MatchSummary-line">NS</span> <Pair names={table.ns} ours={table.ours === 'ns'}/></p>
    <p><span className="MatchSummary-line">EW</span> <Pair names={table.ew} ours={table.ours === 'ew'}/></p>
</div>

const tableIn = (segment, room) => [segment.ourTable, segment.otherTable].find(table => table.room === room)

const resultClass = ([our, their]) => our > their ? 'is-success' : our < their ? 'is-danger' : ''

/*
 * The summary of a team event above the deals (see matchSummary): the matches with their scores and who sat where
 * at both tables. A segment links to its first deal.
 */
const MatchSummary = ({summary, deals, onSelectDeal}) => {
    const boardOf = position => deals[position - 1]?.board ?? position
    return <details className="box MatchSummary">
        <summary className="has-text-weight-bold">Podsumowanie meczów</summary>
        {summary.matches.map(match => <div key={match.title} className="MatchSummary-match">
            <p className="mb-1">
                <span className="has-text-weight-bold">{match.title}:</span>{' '}
                {summary.team} – {match.opponent}{' '}
                <span className={`tag is-light ${resultClass(match.imps)}`}>{match.imps.join(' : ')} IMP</span>{' '}
                {match.vp && <span className="tag is-light">{match.vp.map(formatVp).join(' : ')} VP</span>}
            </p>
            <div className="MatchSummary-grid">
                <div/>
                {ROOMS.map(room => <div key={room} className="MatchSummary-roomName">
                    Pokój {room}
                    {match.segments.every(segment => segment.ourTable.room === room)
                        && <span className="has-text-grey has-text-weight-normal"> (nasz stół)</span>}
                </div>)}
                {match.segments.map(segment => <Fragment key={segment.deals[0]}>
                    <div>
                        <button type="button" className="button is-small is-light"
                                onClick={() => onSelectDeal(segment.deals[0] - 1)}>
                            rozdania {boardOf(segment.deals[0])}-{boardOf(segment.deals[1])}
                        </button>
                    </div>
                    {ROOMS.map(room => <RoomCell key={room} table={tableIn(segment, room)}/>)}
                </Fragment>)}
            </div>
        </div>)}
    </details>
}

export default MatchSummary
