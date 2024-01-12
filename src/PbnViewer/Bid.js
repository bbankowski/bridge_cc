import './PbnViewer.css';
import Club from "../club.svg";
import Heart from "../heart.svg";
import Spade from "../spade.svg";
import Diamond from "../diamond.svg";

const Bid = (props) => {
    function getColor(bid) {
        switch (bid) {
            case "C":
                return Club
            case "D":
                return Diamond
            case "S":
                return Spade
            case "H":
                return Heart
            default:
                return null
        }
    }

    function renderSingleBid(bid) {
        bid = bid.trim()
        if (bid.length === 2 && bid !== "XX") {
            let color = getColor(bid[1])
            return <span>{bid[0]}<img className="App-card-img" src={color} alt=""/></span>
        }
        if ((bid.length === 3 && bid.endsWith("X")) || (bid.length === 4 && bid.endsWith("XX"))) {
            let color = getColor(bid[1])
            return <span>{bid[0]}<img className="App-card-img" src={color}
                                      alt=""/>{bid.endsWith("X") && (bid.length === 3 ? 'X' : 'XX')}</span>
        }
        if (bid.length > 3 && bid.includes("-")) {
            let bids = bid.split("-")
            return [bids.map((bid, index, row) => renderSingleBid(bid, index + 1 === row.length ? null : "-"))]
        }
        return <span>{bid}</span>
    }

    return <span className="Bid">
        {renderSingleBid(props.bid)}
    </span>
}

export default Bid;
