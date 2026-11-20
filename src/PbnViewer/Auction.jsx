import Bid from '../common/Bid'
import {auctionCalls} from './auctionCalls'
import {formatText} from './formatText'

const SEATS = ['N', 'E', 'S', 'W']

const noteNumber = note => /^\s*(\d+)\s*:/.exec(note)?.[1] ?? null

/*
 * The auction table. With visibleCalls only the first calls are shown (a replay); the next cell gets "?" when it is
 * the turn of askSeat, and notes are shown only for the calls already shown.
 */
const Auction = ({auction, notes, visibleCalls, askSeat}) => {
    const calls = auctionCalls(auction)
    const limit = visibleCalls ?? calls.length
    const next = calls[limit] ?? null
    const lastRow = limit < calls.length ? next.row : auction.length - 1
    const shownNotes = new Set(calls.slice(0, limit).map(c => c.call[1]).filter(Boolean))
    const visibleNotes = limit === calls.length ? notes : notes.filter(note => shownNotes.has(noteNumber(note)))

    return <div className="App-bidTable">
        Licytacja:
        <table>
            <thead>
            <tr>{SEATS.map(seat => <th key={seat}>{seat}</th>)}</tr>
            </thead>
            <tbody>
            {auction.slice(0, lastRow + 1).map((row, rowIndex) => <tr key={rowIndex}>
                {row.map((call, index) => {
                    const position = call ? calls.findIndex(c => c.row === rowIndex && c.column === index) : -1
                    if (position >= limit) {
                        const ask = position === limit && next.seat === askSeat
                        return <td key={index} className={ask ? 'is-our-turn' : undefined}>{ask ? '?' : ''}</td>
                    }
                    return <td key={index}>
                        {call && <Bid bid={call[0]}/>}
                        {call?.[1] && <span className="BidNote">{call[1]}</span>}
                    </td>
                })}
            </tr>)}
            </tbody>
        </table>
        {visibleNotes.length > 0 && <div className="BidNotes">
            {visibleNotes.map((note, index) => <div key={index}>{formatText(note)}</div>)}
        </div>}
    </div>
}

export default Auction
