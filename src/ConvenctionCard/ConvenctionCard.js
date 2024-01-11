import './ConvenctionCard.css';
import {useEffect, useState} from "react";
import Club from "../club.svg";
import Heart from "../heart.svg";
import Spade from "../spade.svg";
import Diamond from "../diamond.svg";
import {HashLink} from 'react-router-hash-link';

function ConvenctionCard() {
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
                        items[2] = null
                        items[3] = null

                        if (items[0].length === 2 || items[0].length === 3) {
                            openings.push(items)
                            setOpenings(openings)
                        }

                        return items
                    });

                // set parents
                for (let i = 0; i < bids.length; i++) {
                    let bid = bids[i]
                    for (let j = i - 1; j >= 0; j--) {
                        let parentBid = bids[j]
                        if (bid[0].startsWith(parentBid[0])) {
                            bid[2] = j
                            break;
                        }
                    }
                }

                // set exact parents
                for (let i = 0; i < bids.length; i++) {
                    let bid = bids[i]
                    for (let j = i - 1; j >= 0; j--) {
                        let parentBid = bids[j]
                        if (bid[0].substring(0, bid[0].lastIndexOf('-')) === parentBid[0]) {
                            bid[3] = j
                            break;
                        }
                    }
                }

                console.log(bids)

                setBids(bids)
            })
        })
    }, [])

    let previousBids = []
    let currentBidType = null
    let tableBidLevel = null

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
        if (bid.length === 2 && bid !== "XX") {
            let color = getColor(bid[1])
            return <span>{bid[0]}<img className="App-card-img" src={color}
                                      alt=""/>{additionalString ? " " + additionalString : ""}</span>
        }
        if (bid.length > 3) {
            let bids = bid.split("-")
            return [bids.map((bid, index, row) => renderSingleBid(bid, index + 1 === row.length ? null : "-"))]
        }
        return <span>{bid}{additionalString ? " " + additionalString + " " : ""}</span>
    }

    function renderOpening(index, opening, description) {
        return <div key={"bid" + index}><HashLink to={"#opening-" + opening}><b>{renderSingleBid(opening)}</b> <span
            className="App-description">{description}</span></HashLink></div>
    }

    function chunkMaxLength(arr, chunkSize, maxLength) {
        return Array.from({length: maxLength}, () => arr.splice(0, chunkSize));
    }

    function renderBidTable(index, bid, description) {
        const weStartBidding = currentBidType === "*" || currentBidType === null

        let currentBidParts = bid.split("-")
        currentBidParts.push('?')

        if (currentBidType === null) {
            let newCurrentBidParts = [];
            for (const currentBidPart of currentBidParts) {
                newCurrentBidParts.push(currentBidPart)
                newCurrentBidParts.push('pas')
            }
            currentBidParts = newCurrentBidParts
        }

        while (currentBidParts.length % 4 !== 0) {
            currentBidParts.push('')
        }
        currentBidParts = chunkMaxLength(currentBidParts, 4, currentBidParts.length)

        let foundRootBid = currentBidType === null ? bids[bids[index][3]] : null
        return <div>
            <div className="App-bidTable" id={"bid-" + bid}>
                <div className="App-bidTableHeader">Licytacja
                    po {renderSingleBid(bid)}{foundRootBid && (': ' + foundRootBid[1])} </div>
                <table>
                    <tbody>
                    {currentBidParts.map((currentBidFours, index) => {
                        return <tr>
                            {currentBidFours.map((currentBid, index) => {
                                let theirBid = ((weStartBidding && index % 2 === 1) || (!weStartBidding && index % 2 === 0)) && currentBid.length > 0
                                return <td>
                                    {theirBid && <span>(</span>}
                                    {renderSingleBid(currentBid)}
                                    {theirBid && <span>)</span>}
                                </td>
                            })}
                        </tr>
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    }

    function renderBid(index, bid, description, originalBid) {
        if (bid.length === 2 || bid.length === 3) {
            return <h4 className={"title is-4" + (index > 0 ? " App-bid" : "")} id={"opening-" + bid}>Dalsza licytacja
                po otwarciu {renderSingleBid(bid)}</h4>
        }

        if (bid.startsWith("^") || bid.startsWith("&") || bid.startsWith("*")) {
            return <h4 className="title is-4 App-bid">{bid.slice(1).trim()}</h4>
        }

        if (bid.startsWith('T')) {
            return renderBidTable(index, originalBid.substring(1), description)
        }

        let bidLevel = (bid.match(/-/g) || []).length - tableBidLevel
        let currentBid = bid.substring(bid.lastIndexOf('-') + 1)
        return <div key={"bid" + index} style={{paddingLeft: (20 * bidLevel) + "px"}}>
            <HashLink to={"#bid-" + originalBid}><b>{renderSingleBid(currentBid)}</b> <span
                className="App-description">{description}</span></HashLink>
        </div>
    }

    return (
        <div className="container App">
            <h1 className="title">Karta konwencyjna</h1>
            <p className="subtitle">Bartosz Bańkowski <span className="tag">13886</span><br/>Marek Jarosz <span
                className="tag">10237</span></p>

            <div className="App-openings box">
                <h4 className="title is-4">Otwarcia</h4>
                {openings.map((opening, index) => renderOpening(index, opening[0], opening[1]))}
            </div>
            <div className="box">
                {bids.map((bid, index) => {
                    if (bid[0].startsWith("^") || bid[0].startsWith("&") || bid[0].startsWith("*")) {
                        previousBids = []
                        currentBidType = bid[0][0]
                    }
                    if (bid[0].startsWith("T")) {
                        previousBids = []
                        tableBidLevel = (bid[0].match(/-/g) || []).length
                    }

                    const renderedLine = renderBid(index, bid[0], bid[1], bid[0])

                    let currentBidParts = bid[0].split("-")
                    let cumulativeBid = null
                    currentBidParts.forEach(bid => {
                        cumulativeBid = cumulativeBid === null ? bid : (cumulativeBid + "-" + bid)
                        previousBids.push(cumulativeBid)
                    })

                    return renderedLine
                })}
            </div>
        </div>
    );
}

export default ConvenctionCard;
