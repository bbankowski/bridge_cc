import Bid from '../common/Bid'
import Suit from '../common/Suit'

const STRAINS = ['NT', 'S', 'H', 'D', 'C']

const Minimax = ({minimax, optimumResults}) => {
    const renderTable = seats => <table className="table">
        <thead>
        <tr>
            <th/>
            {STRAINS.map(strain => <th key={strain}>{strain === 'NT' ? 'NT' : <Suit suit={strain}/>}</th>)}
        </tr>
        </thead>
        <tbody>
        {seats.map(seat => <tr key={seat}>
            <td>{seat}</td>
            {STRAINS.map(strain => <td key={strain}>{optimumResults[seat][strain]}</td>)}
        </tr>)}
        </tbody>
    </table>

    return <div className="Minimax">
        {optimumResults && <>
            {renderTable(['N', 'S'])}
            {renderTable(['W', 'E'])}
        </>}
        {minimax && <div className="MinimaxValue">
            Minimax: <Bid bid={minimax.contract}/> {minimax.declarer} {minimax.score}
        </div>}
    </div>
}

export default Minimax
