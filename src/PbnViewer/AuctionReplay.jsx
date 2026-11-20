import {useState} from 'react'
import Auction from './Auction'
import {auctionCalls} from './auctionCalls'

/*
 * The auction revealed call by call, for the covered-hands mode: it starts before the first call of mySeat, and
 * "Do mojej odzywki" reveals everything up to the next decision of mySeat.
 */
const AuctionReplay = ({auction, notes, mySeat}) => {
    const calls = auctionCalls(auction)
    const total = calls.length
    const firstOwn = calls.findIndex(call => call.seat === mySeat)
    const [shown, setShown] = useState(firstOwn >= 0 ? firstOwn : total)

    const nextOwn = () => {
        const index = calls.findIndex((call, i) => i > shown && call.seat === mySeat)
        setShown(index >= 0 ? index : total)
    }
    const ourTurn = calls[shown]?.seat === mySeat

    return <div className="AuctionReplay">
        <Auction auction={auction} notes={notes} visibleCalls={shown} askSeat={mySeat}/>
        <div className="buttons has-addons are-small mt-1 mb-0">
            <button type="button" className="button" aria-label="Początek licytacji" disabled={shown === 0} onClick={() => setShown(0)}>⏮</button>
            <button type="button" className="button" aria-label="Poprzednia odzywka" disabled={shown === 0} onClick={() => setShown(shown - 1)}>‹</button>
            <button type="button" className="button" aria-label="Następna odzywka" disabled={shown === total} onClick={() => setShown(shown + 1)}>›</button>
            <button type="button" className="button" aria-label="Cała licytacja" disabled={shown === total} onClick={() => setShown(total)}>⏭</button>
        </div>
        <button type="button" className="button is-small is-link is-light mt-1" disabled={shown === total} onClick={nextOwn}>
            Do mojej odzywki ⏩
        </button>
        <p className="is-size-7 has-text-grey mt-1">
            {shown === total ? 'Cała licytacja' : ourTurn ? 'Twoja kolej – co mówisz?' : `Odzywka ${shown + 1} z ${total}`}
        </p>
    </div>
}

export default AuctionReplay
