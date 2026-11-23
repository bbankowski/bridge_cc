import {useEffect, useState} from 'react'
import {useBlocker, useSearchParams} from 'react-router'
import './PbnViewer.css'
import Auction from './Auction'
import AuctionReplay from './AuctionReplay'
import Bid from '../common/Bid'
import CardLabel from './CardLabel'
import DealBoard from './DealBoard'
import Minimax from './Minimax'
import DealEditor from './DealEditor'
import DealMenu from './DealMenu'
import {dealResult, FILTERS, formatResult, isGain, isLoss, parseFilters, visibleDeals} from './dealFilters'
import {PLAYERS, seatOf} from './hideHands'
import {openingLead} from './play'
import {loadPbn, serializePbn, updateDeal} from './pbn'
import MatchSummary from './MatchSummary'
import {tournamentOf} from '../tournaments'

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
    const [revealed, setRevealed] = useState(null)
    const [editing, setEditing] = useState(false)

    useEffect(() => {
        let cancelled = false
        loadPbn(filename)
            .then(result => {
                if (!cancelled) {
                    setPbn({filename, ...result})
                    setEditing(false)
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
    const tournament = tournamentOf(pbn.filename)
    // The current deal is kept in the URL (1-based), so a page refresh shows the same deal.
    const currentDeal = Math.min(Math.max(Number(searchParams.get('deal')) - 1 || 0, 0), Math.max(deals.length - 1, 0))
    const deal = deals[currentDeal]
    const lead = deal ? openingLead(deal) : null

    const setCurrentDeal = index => {
        // a revealed deal is covered again after moving to another one, and an edit not saved is dropped
        setRevealed(null)
        setEditing(false)
        setSearchParams(params => {
            params.set('deal', String(index + 1))
            return params
        }, {replace: true})
    }

    // Filters are kept in the URL too (?filter=komentarz,straty); navigation skips the deals they hide.
    const filters = parseFilters(searchParams.get('filter'))
    const visible = visibleDeals(deals, filters)
    const previousDeal = visible.findLast(index => index < currentDeal)
    const nextDeal = visible.find(index => index > currentDeal)

    // "zakryj ręce": only the hand of the chosen player is shown, with nothing that gives the result away (?zakryj=BB)
    const hideFor = PLAYERS[searchParams.get('zakryj')] ? searchParams.get('zakryj') : null
    const dealKey = `${pbn.filename}-${currentDeal}`
    const mySeat = hideFor && deal ? seatOf(deal, hideFor) : null
    const hidden = hideFor !== null && mySeat !== null && revealed !== dealKey
    const setHideFor = player => setSearchParams(params => {
        if (player) {
            params.set('zakryj', player)
        } else {
            params.delete('zakryj')
        }
        return params
    }, {replace: true})

    const toggleFilter = name => {
        const newFilters = filters.includes(name) ? filters.filter(f => f !== name) : [...filters, name]
        const newVisible = visibleDeals(deals, newFilters)
        setSearchParams(params => {
            if (newFilters.length > 0) {
                params.set('filter', newFilters.join(','))
            } else {
                params.delete('filter')
            }
            if (newVisible.length > 0 && !newVisible.includes(currentDeal)) {
                params.set('deal', String(newVisible[0] + 1))
            }
            return params
        }, {replace: true})
    }

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
            if (editing || event.target.closest('textarea, input, select') || event.altKey || event.ctrlKey || event.metaKey) {
                return
            }
            if (event.key === 'ArrowLeft' && previousDeal !== undefined) {
                setCurrentDeal(previousDeal)
            } else if (event.key === 'ArrowRight' && nextDeal !== undefined) {
                setCurrentDeal(nextDeal)
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
            if (window.confirm('Masz niepobrane zmiany w rozdaniach. Opuścić stronę?')) {
                blocker.proceed()
            } else {
                blocker.reset()
            }
        }
    }, [blocker])

    const saveDeal = changes => {
        const edited = updateDeal(deal, changes)
        if (serializePbn([], [edited]) === serializePbn([], [deal])) {
            return
        }
        setPbn({...pbn, deals: deals.map((d, index) => index === currentDeal ? edited : d)})
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
        {tournament?.matches && deals.length > 0
            && <MatchSummary tournament={tournament} deals={deals} onSelectDeal={setCurrentDeal}/>}
        <div className="App-hide-hands">
            <span className="mr-2">Zakryj ręce:</span>
            <div className="buttons has-addons are-small">
                <button type="button" className={`button ${hideFor === null ? 'is-link' : ''}`} aria-pressed={hideFor === null}
                        onClick={() => setHideFor(null)}>wył.</button>
                {Object.entries(PLAYERS).map(([player, {name}]) => <button key={player} type="button" aria-pressed={hideFor === player}
                    className={`button ${hideFor === player ? 'is-link' : ''}`} onClick={() => setHideFor(player)}>
                    widzę rękę: {name}
                </button>)}
            </div>
        </div>
        {hideFor && deal && mySeat === null && <p className="has-text-grey is-size-7 mb-2">
            W tym rozdaniu nie ma {PLAYERS[hideFor].genitive} – pokazuję wszystkie ręce.
        </p>}
        {deal && <div className="box App-deal-box">
            <DealMenu canEdit={!hidden && !editing} isModified={isModified} onEdit={() => setEditing(true)}
                      onDownload={download}/>
            <div className="App-deal">
                <div className="App-deal-header">
                    {deal.event && <h1 className="title">{deal.event}</h1>}
                    {hidden ? <p>
                        Widzisz tylko rękę {PLAYERS[hideFor].genitive} ({mySeat}).
                        <button type="button" className="button is-small is-primary ml-2" onClick={() => setRevealed(dealKey)}>
                            Odkryj rozdanie
                        </button>
                    </p> : <>
                        Kontrakt: <Bid bid={deal.contract}/> {deal.declarer}<br/>
                        Liczba lew: {deal.result}<br/>
                        Zapis: {deal.score || '?'}<br/>
                    </>}
                </div>
                <div className="App-deal-details">
                    {hidden
                        ? <AuctionReplay key={`auction-${dealKey}`} auction={deal.auction} notes={deal.notes} mySeat={mySeat}/>
                        : <div>
                            <Auction auction={deal.auction} notes={deal.notes}/>
                            {lead && <p className="App-deal-lead">Wist: <CardLabel card={lead.card}/> ({lead.seat})</p>}
                        </div>}
                    <DealBoard key={dealKey} deal={deal}
                               hiddenSeats={hidden ? ['N', 'E', 'S', 'W'].filter(seat => seat !== mySeat) : []}/>
                    {!hidden && <Minimax minimax={deal.minimax} optimumResults={deal.optimumResults}/>}
                </div>
                {!hidden && <DealEditor key={dealKey} deal={deal} editing={editing} onSave={saveDeal}
                                        onClose={() => setEditing(false)}/>}
            </div>
            <div className="buttons are-normal App-deal-navigation">
                <button className="button is-light" disabled={previousDeal === undefined}
                        onClick={() => setCurrentDeal(previousDeal)}>Poprzednie
                </button>
                <button className="button is-light" disabled={nextDeal === undefined}
                        onClick={() => setCurrentDeal(nextDeal)}>Następne
                </button>
            </div>
        </div>}
        <div className="App-deal-filters">
            {Object.entries(FILTERS).map(([name, {label}]) => <label key={name} className="checkbox">
                <input type="checkbox" checked={filters.includes(name)} onChange={() => toggleFilter(name)}/> {label}
            </label>)}
            <span className="has-text-grey is-size-7">
                {filters.length > 0 ? `${visible.length} z ${deals.length} rozdań` : `${deals.length} rozdań`}
            </span>
        </div>
        {filters.length > 0 && visible.length === 0 && <p className="has-text-grey mb-3">Brak rozdań spełniających filtr.</p>}
        <div className="buttons are-small App-deal-boards">
            {visible.map(index => {
                const result = dealResult(deals[index])
                // with the hands covered the colours would give the result away
                const color = hideFor ? '' : isLoss(result) ? 'is-danger' : isGain(result) ? 'is-success' : ''
                return <button key={index} className={`button is-light ${color}`} disabled={index === currentDeal}
                               title={hideFor ? undefined : formatResult(result) ?? undefined}
                               onClick={() => setCurrentDeal(index)}>{deals[index].board}</button>
            })}
        </div>
    </div>
}

export default PbnViewer
