import {useEffect, useRef, useState} from 'react'
import BiddingBox from '../Training/BiddingBox'
import {nextSeat, SEATS} from '../Training/calls'
import Auction from './Auction'
import {auctionLines, contractFromAuction, editableAuction, isAuctionComplete, parseContract, scoreTag} from './dealEdit'
import {formatText} from './formatText'

const LEVELS = ['1', '2', '3', '4', '5', '6', '7']
const STRAINS = [['C', '♣'], ['D', '♦'], ['H', '♥'], ['S', '♠'], ['NT', 'BA']]

// The draft calls as rows of the Auction component, with alerts numbered in order.
const draftAuction = (dealer, calls) => {
    const cells = Array(SEATS.indexOf(dealer)).fill(null)
    const notes = []
    calls.forEach(({call, note}) => {
        const cell = [call === 'Pass' ? 'pas' : call]
        if (note.trim()) {
            notes.push(`${notes.length + 1}: ${note.trim()}`)
            cell[1] = String(notes.length)
        }
        cells.push(cell)
    })
    while (cells.length % 4 !== 0) {
        cells.push(null)
    }
    const rows = []
    for (let i = 0; i < cells.length; i += 4) {
        rows.push(cells.slice(i, i + 4))
    }
    return {rows, notes}
}

const splitContract = contract => {
    const parsed = parseContract(contract)
    return parsed
        ? {level: String(parsed.level), strain: parsed.strain, doubled: 'X'.repeat(parsed.doubled)}
        : {level: contract === 'Pass' ? 'Pass' : '', strain: 'NT', doubled: ''}
}

const joinContract = ({level, strain, doubled}) => level === 'Pass' ? 'Pass' : level ? `${level}${strain}${doubled}` : ''

const startDraft = deal => {
    const {dealer, calls} = editableAuction(deal)
    return {
        dealer, calls, initialCalls: calls,
        ...splitContract(deal.contract),
        declarer: deal.declarer ?? '',
        result: deal.result ?? '',
        commentText: deal.commentText ?? '',
    }
}

/*
 * The comment of a deal, and the editor of the whole deal: the auction (clicked on a bidding box, with an alert for
 * each call), the contract with the declarer and the tricks taken, and the comment. The score is computed.
 * onSave gets the changes for updateDeal.
 */
const DealEditor = ({deal, onSave}) => {
    const [draft, setDraft] = useState(null)
    const isEditing = draft !== null
    const commentRef = useRef(null)

    useEffect(() => {
        const textarea = commentRef.current
        if (isEditing && textarea) {
            // start typing at the end of the comment
            textarea.focus()
            textarea.setSelectionRange(textarea.value.length, textarea.value.length)
        }
    }, [isEditing])

    if (!isEditing) {
        return <div className="App-deal-comment">
            <div className="App-deal-comment-header">
                <strong>Komentarz:</strong>
                <button className="button is-small is-light" onClick={() => setDraft(startDraft(deal))}>
                    Edytuj rozdanie
                </button>
            </div>
            <p className="Comment">{formatText(deal.commentText)}</p>
        </div>
    }

    const update = changes => setDraft({...draft, ...changes})
    const {dealer, calls} = draft
    const complete = isAuctionComplete(calls)
    const seat = nextSeat(dealer, calls.length)
    const seatedCalls = calls.map(({call}, index) => ({seat: nextSeat(dealer, index), call}))
    const fromAuction = complete ? contractFromAuction(calls, dealer) : null
    const contract = joinContract(draft)
    const differs = fromAuction && (fromAuction.contract !== contract || fromAuction.declarer !== draft.declarer)
    const tricks = draft.result === '' ? NaN : Number(draft.result)
    const score = scoreTag(contract, draft.declarer, tricks, deal.vulnerable)
    const {rows, notes} = draftAuction(dealer, calls)
    const lastCall = calls.at(-1)

    const setLastNote = note => update({calls: [...calls.slice(0, -1), {...lastCall, note}]})

    // only what was changed is written, so the other details of the original file stay as they were
    const save = () => {
        const auctionChanged = JSON.stringify(calls) !== JSON.stringify(draft.initialCalls)
        const declarer = contract === 'Pass' ? '' : draft.declarer
        const result = contract === 'Pass' ? '' : draft.result
        const resultChanged = contract !== '' && (contract !== (deal.contract ?? '')
            || declarer !== (deal.declarer ?? '') || result !== (deal.result ?? ''))
        onSave({
            auctionLines: auctionChanged ? auctionLines(dealer, calls) : null,
            ...(resultChanged ? {contract, declarer, result, score} : {}),
            commentText: draft.commentText,
        })
        setDraft(null)
    }

    const onKeyDown = event => {
        if (event.key === 'Escape') {
            setDraft(null)
        } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            save()
        }
    }

    return <div className="App-deal-comment DealEditor" onKeyDown={onKeyDown}>
        <div className="DealEditor-auction">
            <div>
                <Auction auction={rows} notes={notes}/>
                <div className="buttons are-small mt-2">
                    <button type="button" className="button is-light" disabled={calls.length === 0}
                            onClick={() => update({calls: calls.slice(0, -1)})}>Cofnij odzywkę</button>
                    <button type="button" className="button is-light" disabled={calls.length === 0}
                            onClick={() => update({calls: []})}>Wyczyść licytację</button>
                </div>
                {lastCall && <div className="field">
                    <label className="label is-small" htmlFor="deal-editor-alert">Alert / objaśnienie ostatniej odzywki</label>
                    <input id="deal-editor-alert" className="input is-small" value={lastCall.note}
                           onChange={e => setLastNote(e.target.value)} placeholder="np. 5+ pików, 11-15 PC"/>
                </div>}
            </div>
            <div>
                <p className="is-size-7 mb-1">{complete ? 'Licytacja zakończona.' : `Odzywka ${seat}:`}</p>
                <BiddingBox calls={seatedCalls} seat={seat} disabled={complete}
                            onSelect={call => update({calls: [...calls, {call, note: ''}]})}/>
            </div>
        </div>

        <div className="DealEditor-contract">
            <div className="field">
                <label className="label is-small" htmlFor="deal-editor-level">Kontrakt</label>
                <div className="DealEditor-row">
                    <div className="select is-small">
                        <select id="deal-editor-level" aria-label="Wysokość" value={draft.level}
                                onChange={e => update({level: e.target.value})}>
                            <option value="">–</option>
                            {LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                            <option value="Pass">pas</option>
                        </select>
                    </div>
                    {draft.level !== 'Pass' && <>
                        <div className="select is-small">
                            <select aria-label="Miano" value={draft.strain} onChange={e => update({strain: e.target.value})}>
                                {STRAINS.map(([strain, label]) => <option key={strain} value={strain}>{label}</option>)}
                            </select>
                        </div>
                        <div className="select is-small">
                            <select aria-label="Kontra" value={draft.doubled} onChange={e => update({doubled: e.target.value})}>
                                <option value="">–</option>
                                <option value="X">X</option>
                                <option value="XX">XX</option>
                            </select>
                        </div>
                        <div className="select is-small">
                            <select aria-label="Rozgrywający" value={draft.declarer}
                                    onChange={e => update({declarer: e.target.value})}>
                                <option value="">rozgrywający</option>
                                {SEATS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <input className="input is-small DealEditor-tricks" type="number" min="0" max="13"
                               aria-label="Lewy" placeholder="lewy" value={draft.result}
                               onChange={e => update({result: e.target.value})}/>
                    </>}
                </div>
            </div>
            <p className="is-size-7">
                Zapis: {score ?? '–'}
                {differs && <>
                    {' · '}<span className="has-text-danger">z licytacji wychodzi {fromAuction.contract} {fromAuction.declarer}</span>
                    <button type="button" className="button is-small is-light ml-2"
                            onClick={() => update({...splitContract(fromAuction.contract), declarer: fromAuction.declarer})}>
                        Ustaw z licytacji
                    </button>
                </>}
            </p>
        </div>

        <div className="field">
            <label className="label is-small" htmlFor="deal-editor-comment">Komentarz</label>
            <textarea id="deal-editor-comment" className="textarea" value={draft.commentText} ref={commentRef}
                      onChange={e => update({commentText: e.target.value})}/>
        </div>
        <div className="buttons are-small App-deal-comment-buttons">
            <button className="button is-primary" onClick={save}>Zapisz</button>
            <button className="button is-light" onClick={() => setDraft(null)}>Anuluj</button>
            <span className="help">Ctrl+Enter zapisuje, Esc anuluje. Zmiany trafiają do pliku po „Pobierz PBN”.</span>
        </div>
    </div>
}

export default DealEditor
