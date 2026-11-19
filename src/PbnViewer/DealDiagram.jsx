import Suit from '../common/Suit'
import {HAND_SUIT_ORDER} from '../common/suits'

const DealDiagram = ({hands, dealer, vulnerable, board}) => {
    const renderSeat = seat => {
        const className = ['Letter', vulnerable.includes(seat) ? 'Vulnerable' : 'NonVulnerable',
            dealer === seat ? 'Dealer' : 'NonDealer'].join(' ')
        return <div className={className}>{seat}</div>
    }

    const renderHand = seat => HAND_SUIT_ORDER.map((suit, index) =>
        <div key={suit}><Suit suit={suit} cards={hands?.[seat]?.[index]}/></div>)

    return <div className="DealDiagram">
        <div className="DealNumber">{board}.</div>
        <div className="North Hand">{renderHand('N')}</div>
        <div className="WestEast">
            <div className="West Hand">{renderHand('W')}</div>
            <div className="Middle">
                {renderSeat('N')}
                <div className="WestEast">
                    {renderSeat('W')}
                    {renderSeat('E')}
                </div>
                {renderSeat('S')}
            </div>
            <div className="East Hand">{renderHand('E')}</div>
        </div>
        <div className="South Hand">{renderHand('S')}</div>
    </div>
}

export default DealDiagram
