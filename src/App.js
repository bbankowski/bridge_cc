import './App.css';
import {useEffect, useState} from "react";
import Club from "./club.svg";
import Heart from "./heart.svg";
import Spade from "./spade.svg";
import Diamond from "./diamond.svg";

function App() {
    const path = "https://raw.githubusercontent.com/bbankowski/bridge_cc/master/bidding.txt"

    const [openings, setOpenings] = useState([])
    const [bids, setBids] = useState([])

    function isBlank(str) {
        return (!str || /^\s*$/.test(str));
    }

    useEffect(() => {
        fetch(path).then((r) => {
            r.text().then(d => {
                let openings = []
                let bids = d.split("\n")
                    .filter(line => !isBlank(line) && !line.startsWith("#"))
                    .map(line => {
                        const items = line.split("=>")
                        items[0] = (items[0] ?? '').trim()
                        items[1] = (items[1] ?? '').trim()

                        if (items[0].length === 2) {
                            openings.push(items)
                            setOpenings(openings)
                        }

                        return items
                    });
                setBids(bids)
            })
        })
    }, [])

    let previousBids = []

    function getColor(bid) {
        switch (bid) {
            case "T":
                return Club
            case "K":
                return Diamond
            case "P":
                return Spade
            case "C":
                return Heart
            default:
                return null
        }
    }

    function renderSingleBid(bid, additionalString) {
        bid = bid.trim()
        if (bid.length === 2) {
            let color = getColor(bid[1])
            return <span>{bid[0]}<img className="App-card-img" src={color} alt=""/>{additionalString ? " " + additionalString : ""}</span>
        }
        if (bid.length > 3) {
            let bids = bid.split("-")
            return [bids.map((bid, index, row) => renderSingleBid(bid, index + 1 === row.length ? null : "-"))]
        }
        return bid
    }

    function renderOpening(index, opening, description) {
        return <div key={"bid" + index}><a href={"#opening-" + opening}><b>{renderSingleBid(opening)}</b> <span
            className="App-description">{description}</span></a></div>;
    }

    function renderBid(index, bid, description) {
        if (bid.length === 2) {
            return <h4 className={"title is-4" + (index > 0 ? " App-bid" : "")} id={"opening-" + bid}>Dalsza licytacja po
                otwarciu {renderSingleBid(bid)}</h4>
        }

        if (bid.startsWith("^") || bid.startsWith("&") || bid.startsWith("*")) {
            return <h4 className="title is-4 App-bid">{bid.slice(1).trim()}</h4>
        }

        while (previousBids.length > 0) {
            let previousBid = previousBids.pop()
            if (bid.startsWith(previousBid)) {
                previousBids.push(previousBid)
                bid = bid.slice(previousBid.length + 1).trim()
                return <div key={"bid" + index} style={{paddingLeft: (10 * previousBid.length) + "px"}}>
                    <b>{renderSingleBid(bid)}</b> <span className="App-description">{description}</span>
                </div>;
            }
        }

        return <div key={"bid" + index}><b>{bid}</b> {description}</div>;
    }

    return (
        <div className="container App">
            <h1 className="title">Karta konwencyjna</h1>
            <h2 className="subtitle">Bartosz Bańkowski <span className="tag">13886</span> - Marek Jarosz <span
                className="tag">10287</span></h2>

            <div className="App-openings box">
                <h4 className="title is-4">Otwarcia</h4>
                {openings.map((opening, index) => renderOpening(index, opening[0], opening[1]))}
            </div>
            <div className="box">
                {bids.map((bid, index) => {
                    const renderedLine = renderBid(index, bid[0], bid[1])
                    previousBids.push(bid[0])
                    return renderedLine
                })}
            </div>
        </div>
    );
}

export default App;
