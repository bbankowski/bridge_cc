import Suit from '../common/Suit'

const rankLabel = rank => (rank === 'T' ? '10' : rank)

// A card such as "HT", shown as a suit icon and "10".
const CardLabel = ({card}) => <span className="PlayCard"><Suit suit={card[0]}/>{rankLabel(card[1])}</span>

export default CardLabel
