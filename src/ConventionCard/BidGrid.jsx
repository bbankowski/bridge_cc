import Bid from '../common/Bid'
import {polishBidToPbn} from '../common/suits'
import {tableRows} from './bidding'

/*
 * Auction table of a convention card sequence (polish calls), ending with "?". Opponent calls are in parentheses:
 * in "*" sections and after our own openings we make the first call, otherwise the opponents do.
 * withoutQuestion hides the final "?"; highlightLast marks the last call of the sequence.
 */
const BidGrid = ({sequence, section, withoutQuestion = false, highlightLast = false}) => {
    const weStartBidding = section === '*' || section === null
    const cells = tableRows(sequence, section).flat()
    const lastIndex = cells.indexOf('?') - (section === null ? 2 : 1)
    const rows = []
    for (let i = 0; i < cells.length; i += 4) {
        rows.push(cells.slice(i, i + 4))
    }
    return <table className="BidGrid">
        <tbody>
        {rows.map((row, rowIndex) => <tr key={rowIndex}>
            {row.map((call, index) => {
                const position = rowIndex * 4 + index
                if (call === '?' && withoutQuestion) {
                    return <td key={index}/>
                }
                const theirCall = call !== '' && call !== '?' && (index % 2 === 1) === weStartBidding
                return <td key={index} className={highlightLast && position === lastIndex ? 'is-highlighted' : undefined}>
                    {theirCall && '('}<Bid bid={polishBidToPbn(call)}/>{theirCall && ')'}
                </td>
            })}
        </tr>)}
        </tbody>
    </table>
}

export default BidGrid
