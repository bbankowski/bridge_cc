import './PbnViewer.css';
import React, {useEffect, useState} from "react";
import Auction from "./Auction";
import DealDiagram from "./DealDiagram";
import {useLocation} from "react-router-dom";
import Bid from "./Bid";
import Minimax from "./Minimax";
import {loadPbn} from "./PbnLoader"

function PbnViewer() {
    const [deals, setDeals] = useState([])
    const [currentDeal, setCurrentDeal] = useState(0)

    function useQuery() {
        const {search} = useLocation()

        return React.useMemo(() => new URLSearchParams(search), [search])
    }

    let query = useQuery()

    useEffect(() => {
        const filename = query.get("filename")
        loadPbn(filename).then(loadedDeals => {
            setDeals(loadedDeals)
            setCurrentDeal(0)
        })
    }, [query])

    let deal = deals.length > currentDeal ? deals[currentDeal] : null

    const next = () => {
        let newDeal = currentDeal + 1
        if (newDeal < deals.length) {
            setCurrentDeal(newDeal)
        }
    }

    const prev = () => {
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
                        {deal['Event'] && <h1 className="title">{deal['Event']}</h1>}
                        Contract: <Bid bid={deal['Contract']}/> {deal['Declarer']}<br/>
                        Result (tricks): {deal['Result']}<br/>
                        Score: {deal['Score'] || '?'}<br/>
                    </div>
                    <div className="App-deal-details">
                        <Auction auction={deal['chunkedAuction']} notes={deal['notes']}/>
                        <DealDiagram deal={deal['hands']} dealer={deal['Auction']} vulnerable={deal['Vulnerable']}
                                     dealNumber={deal['Board']}/>
                        <Minimax minimax={deal['Minimax']} optimumResults={deal['optimumResultTable']}/>
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
