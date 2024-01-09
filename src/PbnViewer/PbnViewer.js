import './PbnViewer.css';
import React, {useEffect, useState} from "react";
import Auction from "./Auction";
import DealDiagram from "./DealDiagram";
import {useLocation} from "react-router-dom";
import Bid from "./Bid";
import reactStringReplace from 'react-string-replace'
import Suite from "./Suite";

function PbnViewer() {
    const [deals, setDeals] = useState([])
    const [currentDeal, setCurrentDeal] = useState(0)

    function useQuery() {
        const {search} = useLocation()

        return React.useMemo(() => new URLSearchParams(search), [search])
    }

    let query = useQuery()

    useEffect(() => {
        function updateDeal(deal) {
            let hands = deal['Deal'].split(' ')
            let players = {
                'N': ['N', 'E', 'S', 'W'],
                'E': ['E', 'S', 'W', 'N'],
                'S': ['S', 'W', 'N', 'E'],
                'W': ['W', 'N', 'E', 'S'],
            }
            let firstHand = hands[0].charAt(0)
            hands[0] = hands[0].substring(2)
            deal['hands'] = []
            for (let i = 0; i < 4; i++) {
                deal['hands'][players[firstHand][i]] = hands[i].split('.')
            }

            let bids = []
            if (deal['Dealer'] === 'E') {
                bids.push([])
            } else if (deal['Dealer'] === 'S') {
                bids.push([])
                bids.push([])
            } else if (deal['Dealer'] === 'W') {
                bids.push([])
                bids.push([])
                bids.push([])
            }
            let previousBid = null
            if (deal && deal['auction'] && deal['auction'].length > 0) {
                for (let bid of deal['auction'].trim().split(' ')) {
                    bid = bid.trim()
                    if (bid === 'Pass') {
                        bid = 'pas'
                    } else if (bid === 'AP') {
                        break
                    } else if (bid.startsWith('=')) {
                        previousBid[1] = bid.replaceAll('=', '')
                        continue
                    }
                    previousBid = [bid]
                    bids.push(previousBid)
                }
            }
            bids.push(['pas'])
            bids.push(['pas'])
            bids.push(['pas'])
            while (bids.length % 4 !== 0) {
                bids.push([])
            }
            deal['chunkedAuction'] = chunkMaxLength(bids, 4, bids.length / 4)

            if (deal['Vulnerable'] === 'Love' || deal['Vulnerable'] === 'None' || deal['Vulnerable'] === '-') {
                deal['Vulnerable'] = []
            }
            if (deal['Vulnerable'] === 'Both' || deal['Vulnerable'] === 'All') {
                deal['Vulnerable'] = ['N', 'S', 'E', 'W']
            }
            if (deal['Vulnerable'] === 'NS') {
                deal['Vulnerable'] = ['N', 'S']
            }
            if (deal['Vulnerable'] === 'EW') {
                deal['Vulnerable'] = ['E', 'W']
            }

            let comment = deal['comment'] || ''
            comment = comment.replaceAll('\\n', '')
            let foundBids = comment.matchAll(/(\\[SCDH])/g)
            if (foundBids) {
                for (const foundBid of foundBids) {
                    let bid = foundBid[0].replace('\\','')
                    comment = reactStringReplace(comment, foundBid[0], (foundBid, i) => (
                        <Suite suite={bid} cards=''/>
                    ));
                }
            }
            deal['comment'] = comment

            return deal
        }

        const filename = query.get("filename")

        fetch(filename).then((r) => {
            r.text().then(pbn => {
                let loadedDeals = []
                const lines = pbn.split(/\r?\n/)

                let deal = []
                deal['Vulnerable'] = '-'
                let commentStarted = false
                let comment = ''
                let auctionStarted = false
                let auction = ''
                for (const line of lines) {
                    if (line.startsWith('%')) {
                        continue
                    }

                    if (line.startsWith('[Event') && Object.keys(deal).length > 1) {
                        loadedDeals.push(updateDeal(deal))
                        deal = []
                        deal['Vulnerable'] = '-'
                    }
                    if (auctionStarted) {
                        if (line.startsWith('[')) {
                            deal['auction'] = auction
                            auctionStarted = false
                            auction = ''
                        } else {
                            auction += " " + line
                            continue
                        }
                    }
                    if (commentStarted) {
                        comment += "\n" + line
                        if (line.endsWith('}')) {
                            comment = comment.slice(0, -1)
                            commentStarted = false
                            deal['comment'] = comment
                            comment = ''
                        }
                        continue
                    }

                    if (line.startsWith('[')) {
                        let found = line.match(/\[([A-Za-z]+) "(.*)"]/)
                        if (found && found.length === 3) {
                            let tag = found[1]
                            let param = found[2]
                            deal[tag] = param
                            if (tag === 'Auction') {
                                auctionStarted = true
                            }
                        }
                    } else if (line.startsWith('{')) {
                        if (line.endsWith('}')) {
                            comment = line.slice(1, -1)
                        } else {
                            commentStarted = true
                            comment = line.substring(1)
                        }
                    }
                }

                if (Object.keys(deal).length > 1) {
                    loadedDeals.push(updateDeal(deal))
                }

                setDeals(loadedDeals)
                setCurrentDeal(0)
            })
        })
    }, [query])

    function chunkMaxLength(arr, chunkSize, maxLength) {
        return Array.from({length: maxLength}, () => arr.splice(0, chunkSize));
    }

    let deal = deals.length > currentDeal ? deals[currentDeal] : null

    const next = event => {
        let newDeal = currentDeal + 1
        if (newDeal < deals.length) {
            setCurrentDeal(newDeal)
        }
    }

    const prev = event => {
        let newDeal = currentDeal - 1
        if (newDeal >= 0) {
            setCurrentDeal(newDeal)
        }
    }

    return (
        <div className="App container">
            {deal && <div className="box">
                <div className="App-deal">
                    <div className="App-deal-header">
                        <h1 className="title">{deal['Event']}</h1>
                        Contract: <Bid bid={deal['Contract']}/><br/>
                        Result (tricks): {deal['Result']}<br/>
                        Score: {deal['Score']}<br/>
                    </div>
                    <div className="App-deal-details">
                        <DealDiagram deal={deal['hands']} dealer={deal['Auction']} vulnerable={deal['Vulnerable']}
                                     dealNumber={deal['Board']}/>
                        <Auction auction={deal['chunkedAuction']} notes={deal['Note']}/>
                    </div>
                    <div className="App-deal-comment">
                        <p><strong>Comment:</strong></p>
                        <p className="Comment">{deal['comment']}</p>
                    </div>
                </div>
            </div>}
            <div className="buttons are-normal">
                <button className="button is-light" disabled={currentDeal - 1 < 0} onClick={prev}>Poprzednie</button>
                <button className="button is-light" disabled={currentDeal + 1 >= deals.length} onClick={next}>Następne
                </button>
            </div>
            <div className="buttons are-small">
                {deals.map((deal, index) => {
                    return <button className="button is-light" disabled={index === currentDeal}
                                   onClick={() => setCurrentDeal(index)}>{deal['Board']}</button>
                })}
            </div>
        </div>
    );
}

export default PbnViewer;
