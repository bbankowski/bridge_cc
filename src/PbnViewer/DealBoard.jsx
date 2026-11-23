import {useMemo, useState} from 'react'
import CardLabel from './CardLabel'
import DealDiagram from './DealDiagram'
import {playSequence, positionAfter} from './play'

/*
 * The deal diagram with a replay of the recorded play, card by card, opened with the "▶" button in its corner.
 * Played cards leave the hands, the current trick is shown in the middle of the diagram. The opening lead alone is
 * shown under the auction, not here.
 */
const DealBoard = ({deal, hiddenSeats = []}) => {
    const sequence = useMemo(() => playSequence(deal), [deal])
    const [step, setStep] = useState(0)
    const [playing, setPlaying] = useState(false)
    const position = sequence ? positionAfter(sequence, step) : null
    const total = sequence?.plays.length ?? 0

    // steps at which a trick is complete (or the record ends): « and » jump between them
    const trickEnds = sequence ? [0, ...sequence.tricks.map((trick, index) =>
        sequence.plays.findLastIndex(play => play.trick === index) + 1)] : [0]
    const previousTrick = () => setStep(trickEnds.findLast(end => end < step) ?? 0)
    const nextTrick = () => setStep(trickEnds.find(end => end > step) ?? total)

    const canReplay = total > 1 && hiddenSeats.length === 0
    const togglePlaying = () => {
        setStep(0)
        setPlaying(!playing)
    }

    return <div className="DealBoard">
        <div className="DealBoard-diagram">
            <DealDiagram hands={deal.hands} dealer={deal.dealer} vulnerable={deal.vulnerable} board={deal.board}
                         played={position?.played} trick={position?.trick}
                         renderCard={card => <CardLabel card={card}/>} hiddenSeats={hiddenSeats}/>
            {canReplay && <button type="button" className={`button is-small DealBoard-play ${playing ? 'is-link' : 'is-light'}`}
                                  aria-label={playing ? 'Zamknij rozgrywkę' : 'Odtwórz rozgrywkę'} aria-pressed={playing}
                                  title={playing ? 'Zamknij rozgrywkę' : 'Odtwórz rozgrywkę'} onClick={togglePlaying}>
                {playing ? '✕' : '▶'}
            </button>}
        </div>
        {canReplay && playing && <div className="PlayControls">
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
        </div>}
    </div>
}

export default DealBoard
