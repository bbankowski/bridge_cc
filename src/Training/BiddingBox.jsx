import Bid from '../common/Bid'
import {isLegal, STRAINS} from './calls'

const LEVELS = [1, 2, 3, 4, 5, 6, 7]

// Clickable bidding box; calls that are not legal after `calls` for `seat` are disabled.
const BiddingBox = ({calls, seat, onSelect, disabled = false}) => {
    const button = (call, label, className = '') => <button key={call} type="button"
        className={`button BiddingBox-call ${className}`} disabled={disabled || !isLegal(calls, seat, call)}
        onClick={() => onSelect(call)} aria-label={call}>
        {label}
    </button>

    return <div className="BiddingBox">
        <div className="BiddingBox-bids">
            {LEVELS.map(level => <div key={level} className="BiddingBox-row">
                {STRAINS.map(strain => button(`${level}${strain}`,
                    strain === 'NT' ? `${level}BA` : <Bid bid={`${level}${strain}`}/>))}
            </div>)}
        </div>
        <div className="BiddingBox-special">
            {button('Pass', 'pas', 'is-success is-light')}
            {button('X', 'X', 'is-danger is-light')}
            {button('XX', 'XX', 'is-info is-light')}
        </div>
    </div>
}

export default BiddingBox
