import {useMemo, useState} from 'react'
import Suit from '../common/Suit'
import DealDiagram from './DealDiagram'
import {playSequence, positionAfter} from './play'

const rankLabel = rank => (rank === 'T' ? '10' : rank)
const CardLabel = ({card}) => <span className="PlayCard"><Suit suit={card[0]}/>{rankLabel(card[1])}</span>

/*
 * The deal diagram with a replay of the recorded play, card by card. Played cards leave the hands, the current trick
 * is shown in the middle of the diagram.
 */
const DealBoard = ({deal}) => {
    const sequence = useMemo(() => playSequence(deal), [deal])
    const [step, setStep] = useState(0)
    const position = sequence ? positionAfter(sequence, step) : null
    const total = sequence?.plays.length ?? 0

    // steps at which a trick is complete (or the record ends): « and » jump between them
    const trickEnds = sequence ? [0, ...sequence.tricks.map((trick, index) =>
        sequence.plays.findLastIndex(play => play.trick === index) + 1)] : [0]
    const previousTrick = () => setStep(trickEnds.findLast(end => end < step) ?? 0)
    const nextTrick = () => setStep(trickEnds.find(end => end > step) ?? total)

    return <div className="DealBoard">
        <DealDiagram hands={deal.hands} dealer={deal.dealer} vulnerable={deal.vulnerable} board={deal.board}
                     played={position?.played} trick={position?.trick}
                     renderCard={card => <CardLabel card={card}/>}/>
        {sequence && <div className="PlayControls">
            {total === 1
                ? <p className="is-size-7">Zapisany tylko wist: <CardLabel card={sequence.plays[0].card}/>
                    <button type="button" className="button is-small is-light ml-2" onClick={() => setStep(step ? 0 : 1)}>
                        {step ? 'Ukryj' : 'Pokaż'}
                    </button></p>
                : <>
                    <div className="buttons has-addons are-small mb-1">
                        <button type="button" className="button" aria-label="Początek" disabled={step === 0} onClick={() => setStep(0)}>⏮</button>
                        <button type="button" className="button" aria-label="Poprzednia lewa" disabled={step === 0} onClick={previousTrick}>«</button>
                        <button type="button" className="button" aria-label="Poprzednia karta" disabled={step === 0} onClick={() => setStep(step - 1)}>‹</button>
                        <button type="button" className="button" aria-label="Następna karta" disabled={step === total} onClick={() => setStep(step + 1)}>›</button>
                        <button type="button" className="button" aria-label="Następna lewa" disabled={step === total} onClick={nextTrick}>»</button>
                        <button type="button" className="button" aria-label="Koniec" disabled={step === total} onClick={() => setStep(total)}>⏭</button>
                    </div>
                    <p className="is-size-7">
                        {step === 0 ? `Rozgrywka: ${sequence.tricks.length} ${sequence.tricks.length < 5 ? 'lewy' : 'lew'} w zapisie`
                            : `Lewa ${position.trickNumber} z ${sequence.tricks.length} · NS ${position.won.NS} : EW ${position.won.EW}`}
                    </p>
                </>}
        </div>}
    </div>
}

export default DealBoard
