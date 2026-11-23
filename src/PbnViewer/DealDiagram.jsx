import Suit from '../common/Suit'
import {HAND_SUIT_ORDER} from '../common/suits'

/*
 * The four hands around the table. During a replay `played` holds the cards already played (e.g. "HQ"), which are
 * not shown, and `trick` the cards of the current trick ({N: "HQ"}), shown in the middle instead of the seat letters.
 * The hands of hiddenSeats are covered. The hand of activeSeat (e.g. whose call is entered in the deal editor) is
 * highlighted.
 */
const DealDiagram = ({hands, dealer, vulnerable, board, played = null, trick = {}, renderCard = card => card, hiddenSeats = [], activeSeat = null}) => {
    const renderSeat = seat => {
        if (trick?.[seat]) {
            return <div className="Letter TrickCard">{renderCard(trick[seat])}</div>
        }
        const className = ['Letter', vulnerable.includes(seat) ? 'Vulnerable' : 'NonVulnerable',
            dealer === seat ? 'Dealer' : 'NonDealer', ...(seat === activeSeat ? ['is-active'] : [])].join(' ')
        return <div className={className}>{seat}</div>
    }

    const renderHand = seat => hiddenSeats.includes(seat)
        ? <div className="HiddenHand" aria-label={`ręka ${seat} zakryta`}>?</div>
        : HAND_SUIT_ORDER.map((suit, index) => {
        const cards = [...(hands?.[seat]?.[index] ?? '')].filter(rank => !played?.has(suit + rank)).join('')
        return <div key={suit}><Suit suit={suit} cards={cards}/></div>
    })

    const handClass = (name, seat) => `${name} Hand${seat === activeSeat ? ' is-active' : ''}`

    return <div className="DealDiagram">
        <div className="DealNumber">{board}.</div>
        <div className={handClass('North', 'N')}>{renderHand('N')}</div>
        <div className="WestEast">
            <div className={handClass('West', 'W')}>{renderHand('W')}</div>
            <div className="Middle">
                {renderSeat('N')}
                <div className="WestEast">
                    {renderSeat('W')}
                    {renderSeat('E')}
                </div>
                {renderSeat('S')}
            </div>
            <div className={handClass('East', 'E')}>{renderHand('E')}</div>
        </div>
        <div className={handClass('South', 'S')}>{renderHand('S')}</div>
    </div>
}

export default DealDiagram
