import Bid from '../common/Bid'
import {polishBidToPbn} from '../common/suits'
import {tableRows} from './bidding'

/*
 * Auction table of a convention card sequence (polish calls), ending with "?". Opponent calls are in parentheses,
 * as in the sequence (see tableRows). withoutQuestion hides the final "?"; highlightLast marks the last call of the
 * sequence.
 */
const BidGrid = ({sequence, withoutQuestion = false, highlightLast = false}) => {
    let cells = tableRows(sequence).flat()
    const question = cells.findIndex(cell => cell.call === '?')
    const lastIndex = cells.findLastIndex((cell, index) => index < question && !cell.implicit)
    if (withoutQuestion) {
        // end the table on the last call, without a row left empty by the hidden "?"
        cells = cells.slice(0, question)
        while (cells.length % 4 !== 0) {
            cells.push({call: '', theirs: false})
        }
    }
    const rows = []
    for (let i = 0; i < cells.length; i += 4) {
        rows.push(cells.slice(i, i + 4))
    }
    return <table className="BidGrid">
        <tbody>
        {rows.map((row, rowIndex) => <tr key={rowIndex}>
            {row.map(({call, theirs}, index) => {
                const position = rowIndex * 4 + index
                const theirCall = theirs && call !== ''
                return <td key={index} className={highlightLast && position === lastIndex ? 'is-highlighted' : undefined}>
                    {theirCall && '('}<Bid bid={polishBidToPbn(call)}/>{theirCall && ')'}
                </td>
            })}
        </tr>)}
        </tbody>
    </table>
}

export default BidGrid
