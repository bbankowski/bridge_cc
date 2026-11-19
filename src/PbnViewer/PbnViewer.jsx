import {useEffect, useState} from 'react'
import {useBlocker, useSearchParams} from 'react-router'
import './PbnViewer.css'
import Auction from './Auction'
import Bid from '../common/Bid'
import DealDiagram from './DealDiagram'
import Minimax from './Minimax'
import CommentEditor from './CommentEditor'
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
    const [searchParams, setSearchParams] = useSearchParams()
    const filename = searchParams.get('filename')

    const [pbn, setPbn] = useState({filename: null, headers: [], deals: []})
    const [error, setError] = useState(null)
    const [isModified, setIsModified] = useState(false)

    useEffect(() => {
        let cancelled = false
        loadPbn(filename)
            .then(result => {
                if (!cancelled) {
                    setPbn({filename, ...result})
                    setError(null)
                    setIsModified(false)
                }
            })
            .catch(e => !cancelled && setError(e.message))
        return () => {
            cancelled = true
        }
    }, [filename])

    const {headers, deals} = pbn
    // The current deal is kept in the URL (1-based), so a page refresh shows the same deal.
    const currentDeal = Math.min(Math.max(Number(searchParams.get('deal')) - 1 || 0, 0), Math.max(deals.length - 1, 0))
    const deal = deals[currentDeal]

    const setCurrentDeal = index => setSearchParams(params => {
        params.set('deal', String(index + 1))
        return params
    }, {replace: true})

    useEffect(() => {
        if (!isModified) {
            return
        }
        // warn before losing edited comments that were not downloaded
        const onBeforeUnload = event => event.preventDefault()
        window.addEventListener('beforeunload', onBeforeUnload)
        return () => window.removeEventListener('beforeunload', onBeforeUnload)
    }, [isModified])

    useEffect(() => {
        const onKeyDown = event => {
            if (event.target.closest('textarea, input') || event.altKey || event.ctrlKey || event.metaKey) {
                return
            }
            if (event.key === 'ArrowLeft' && currentDeal > 0) {
                setCurrentDeal(currentDeal - 1)
            } else if (event.key === 'ArrowRight' && currentDeal < deals.length - 1) {
                setCurrentDeal(currentDeal + 1)
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    })

    // in-app navigation to another page or file would also drop the edited comments
    const blocker = useBlocker(({currentLocation, nextLocation}) => isModified
        && (currentLocation.pathname !== nextLocation.pathname
            || new URLSearchParams(nextLocation.search).get('filename') !== filename))

    useEffect(() => {
        if (blocker.state === 'blocked') {
            if (window.confirm('Masz niepobrane zmiany w komentarzach. Opuścić stronę?')) {
                blocker.proceed()
            } else {
                blocker.reset()
            }
        }
    }, [blocker])

    const updateComment = commentText => {
        if (commentText === deal.commentText) {
            return
        }
        setPbn({...pbn, deals: deals.map((d, index) => index === currentDeal ? {...d, commentText} : d)})
        setIsModified(true)
    }

    const download = () => {
        downloadFile(filename, serializePbn(headers, deals))
        setIsModified(false)
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
                <CommentEditor key={`${pbn.filename}-${currentDeal}`} commentText={deal.commentText}
                               onSave={updateComment}/>
            </div>
        </div>}
        <div className="buttons are-normal App-deal-navigation">
            <button className="button is-light" disabled={currentDeal <= 0}
                    onClick={() => setCurrentDeal(currentDeal - 1)}>Poprzednie
            </button>
            <button className="button is-light" disabled={currentDeal >= deals.length - 1}
                    onClick={() => setCurrentDeal(currentDeal + 1)}>Następne
            </button>
            <button className={'button ' + (isModified ? 'is-primary' : 'is-light')} onClick={download}
                    title={isModified ? 'Są niepobrane zmiany w komentarzach' : undefined}>
                Pobierz PBN{isModified && ' *'}
            </button>
        </div>
        <div className="buttons are-small">
            {deals.map((d, index) => <button key={index} className="button is-light" disabled={index === currentDeal}
                                             onClick={() => setCurrentDeal(index)}>{d.board}</button>)}
        </div>
    </div>
}

export default PbnViewer
