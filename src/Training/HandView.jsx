import Suit from '../common/Suit'
import {HAND_SUIT_ORDER} from '../common/suits'

const rankLabel = rank => (rank === 'T' ? '10' : rank)

// Shows a hand ("S.H.D.C"); with onSelectCard the cards are buttons (for choosing a lead).
const HandView = ({hand, onSelectCard, disabled = false, selected = null}) => {
    const suits = hand.split('.')
    return <div className="HandView">
        {HAND_SUIT_ORDER.map((suit, index) => <div key={suit} className="HandView-suit">
            <Suit suit={suit}/>
            {suits[index] === '' && <span className="has-text-grey">—</span>}
            {[...suits[index]].map(rank => onSelectCard
                ? <button key={rank} type="button" disabled={disabled} aria-label={`${suit}${rank}`}
                          className={`button is-small HandView-card${selected === suit + rank ? ' is-link' : ''}`}
                          onClick={() => onSelectCard(suit + rank)}>{rankLabel(rank)}</button>
                : <span key={rank} className="HandView-rank">{rankLabel(rank)}</span>)}
        </div>)}
    </div>
}

export const CardLabel = ({card}) => card
    ? <span><Suit suit={card[0]}/>{card[1] === 'x' ? 'blotka' : rankLabel(card[1])}</span>
    : null

export default HandView
