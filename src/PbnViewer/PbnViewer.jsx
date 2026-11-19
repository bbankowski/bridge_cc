import {useEffect, useState} from 'react'
import {useSearchParams} from 'react-router'
import './PbnViewer.css'
import Auction from './Auction'
import Bid from '../common/Bid'
import DealDiagram from './DealDiagram'
import Minimax from './Minimax'
import {formatText} from './formatText'
import {loadPbn, serializePbn} from './pbn'

const downloadFile = (filename, content) => {
    const url = URL.createObjectURL(new Blob([content], {type: 'text/plain'}))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

const PbnViewer = () => {
    const [searchParams] = useSearchParams()
    const filename = searchParams.get('filename')

    const [pbn, setPbn] = useState({headers: [], deals: []})
    const [error, setError] = useState(null)
    const [currentDeal, setCurrentDeal] = useState(0)
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        let cancelled = false
        loadPbn(filename)
            .then(result => {
                if (!cancelled) {
                    setPbn(result)
                    setError(null)
                    setCurrentDeal(0)
                }
            })
            .catch(e => !cancelled && setError(e.message))
        return () => {
            cancelled = true
        }
    }, [filename])

    const {headers, deals} = pbn
    const deal = deals[currentDeal]

    const updateComment = commentText => {
        setPbn({headers, deals: deals.map((d, index) => index === currentDeal ? {...d, commentText} : d)})
        setIsEditing(false)
    }

    if (error) {
        return <div className="App container"><div className="notification is-danger">{error}</div></div>
    }

    return <div className="App container">
        {deal && <div className="box">
            <div className="App-deal">
                <div className="App-deal-header">
                    {deal.event && <h1 className="title">{deal.event}</h1>}
                    Contract: <Bid bid={deal.contract}/> {deal.declarer}<br/>
                    Result (tricks): {deal.result}<br/>
                    Score: {deal.score || '?'}<br/>
                </div>
                <div className="App-deal-details">
                    <Auction auction={deal.auction} notes={deal.notes}/>
                    <DealDiagram hands={deal.hands} dealer={deal.dealer} vulnerable={deal.vulnerable}
                                 board={deal.board}/>
                    <Minimax minimax={deal.minimax} optimumResults={deal.optimumResults}/>
                </div>
                <div className="App-deal-comment" onClick={() => setIsEditing(true)}>
                    <p><strong>Comment:</strong></p>
                    {isEditing
                        ? <textarea onBlur={e => updateComment(e.target.value)} defaultValue={deal.commentText}/>
                        : <p className="Comment">{formatText(deal.commentText)}</p>}
                </div>
            </div>
        </div>}
        <div className="buttons are-normal">
            <button className="button is-light" disabled={currentDeal <= 0}
                    onClick={() => setCurrentDeal(currentDeal - 1)}>Poprzednie
            </button>
            <button className="button is-light" disabled={currentDeal >= deals.length - 1}
                    onClick={() => setCurrentDeal(currentDeal + 1)}>Następne
            </button>
            <button className="button is-light" onClick={() => downloadFile(filename, serializePbn(headers, deals))}>
                Pobierz PBN
            </button>
        </div>
        <div className="buttons are-small">
            {deals.map((d, index) => <button key={index} className="button is-light" disabled={index === currentDeal}
                                             onClick={() => setCurrentDeal(index)}>{d.board}</button>)}
        </div>
    </div>
}

export default PbnViewer
