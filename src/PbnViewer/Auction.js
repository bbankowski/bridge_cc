import './PbnViewer.css';
import Bid from "./Bid";

const Auction = (props) => {
    return <div className="App-bidTable">
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
            {props.auction.map((bidFours) => {
                return <tr>
                    {bidFours.map((bid, index) => {
                        return <td>
                            {bid && bid[0] && <Bid bid={bid[0]}/>}
                            {bid && bid[1] && <span className="BidNote">{bid[1]}</span>}
                        </td>
                    })}
                </tr>
            })}
            </tbody>
        </table>
        {props.notes && <div className="BidNotes">{props.notes.map((note) => {
            return <div>{note}</div>
        })}</div>}
    </div>
}

export default Auction;
