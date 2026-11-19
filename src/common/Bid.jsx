import Suit from './Suit'

// Renders a single call or contract with a suit icon, e.g. "4H", "3DX", "2SXX". Anything else (NT/BA, pass,
// X, ?) is shown as text.
const Bid = ({bid = ''}) => {
    const match = /^([1-7])([CDHS])(X{0,2})$/.exec(bid.trim())
    if (!match) {
        return <span className="Bid">{bid}</span>
    }
    const [, level, suit, doubled] = match
    return <span className="Bid">{level}<Suit suit={suit}/>{doubled}</span>
}

export default Bid
