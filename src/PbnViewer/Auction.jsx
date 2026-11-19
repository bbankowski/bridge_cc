import Bid from '../common/Bid'
import {formatText} from './formatText'

const Auction = ({auction, notes}) => <div className="App-bidTable">
    Licytacja:
    <table>
        <thead>
        <tr>
            <th>N</th>
            <th>E</th>
            <th>S</th>
            <th>W</th>
        </tr>
        </thead>
        <tbody>
        {auction.map((row, rowIndex) => <tr key={rowIndex}>
            {row.map((call, index) => <td key={index}>
                {call && <Bid bid={call[0]}/>}
                {call?.[1] && <span className="BidNote">{call[1]}</span>}
            </td>)}
        </tr>)}
        </tbody>
    </table>
    {notes.length > 0 && <div className="BidNotes">
        {notes.map((note, index) => <div key={index}>{formatText(note)}</div>)}
    </div>}
</div>

export default Auction
