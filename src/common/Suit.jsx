import {SUIT_ICONS} from './suits'

const Suit = ({suit, cards}) => <span className="Suit">
    <img className="App-card-img" src={SUIT_ICONS[suit]} alt={suit}/>
    {cards}
</span>

export default Suit
