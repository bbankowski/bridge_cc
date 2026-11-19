import {Fragment, useEffect, useMemo} from 'react'
import {Link, useLocation} from 'react-router'
import './ConventionCard.css'
import biddingText from '../../bidding.txt?raw'
import Bid from '../common/Bid'
import {polishBidToPbn} from '../common/suits'
import {parseBidding, tableRows} from './bidding'

const scrollToElement = id => document.getElementById(id)?.scrollIntoView()

const AnchorLink = ({id, children}) =>
    <Link to={{hash: id}} onClick={() => scrollToElement(id)}>{children}</Link>

const BidSequence = ({sequence}) => sequence.split('-').map((call, index) => <Fragment key={index}>
    {index > 0 && '-'}
    <Bid bid={polishBidToPbn(call)}/>
</Fragment>)

const BidTable = ({id, sequence, section, description}) => {
    // "*" sections and our own openings: we make the first call; otherwise the opponents do.
    const weStartBidding = section === '*' || section === null
    return <div className="App-bidTable" id={id}>
        <div className="App-bidTableHeader">
            Licytacja po <BidSequence sequence={sequence}/>{description && `: ${description}`}
        </div>
        <table>
            <tbody>
            {tableRows(sequence, section).map((row, rowIndex) => <tr key={rowIndex}>
                {row.map((call, index) => {
                    const theirCall = call !== '' && (index % 2 === 1) === weStartBidding
                    return <td key={index}>
                        {theirCall && '('}<Bid bid={polishBidToPbn(call)}/>{theirCall && ')'}
                    </td>
                })}
            </tr>)}
            </tbody>
        </table>
    </div>
}

const ConventionCard = () => {
    const entries = useMemo(() => parseBidding(biddingText), [])
    const {hash} = useLocation()

    useEffect(() => {
        if (hash) {
            scrollToElement(decodeURIComponent(hash.substring(1)))
        }
    }, [hash])

    const renderEntry = (entry, index) => {
        switch (entry.type) {
            case 'section':
                return <h4 key={index} className="title is-4 App-bid">{entry.title}</h4>
            case 'opening':
                return <h4 key={index} className={'title is-4' + (index > 0 ? ' App-bid' : '')}
                           id={`opening-${entry.sequence}`}>
                    Dalsza licytacja po otwarciu <Bid bid={polishBidToPbn(entry.sequence)}/>
                </h4>
            case 'table':
                return <BidTable key={index} {...entry}/>
            default: {
                const lastCall = entry.sequence.substring(entry.sequence.lastIndexOf('-') + 1)
                const content = <><b><Bid bid={polishBidToPbn(lastCall)}/></b>
                    <span className="App-description">{entry.description}</span></>
                return <div key={index} className="App-bidLine" style={{'--level': entry.level}}>
                    {entry.target
                        ? <AnchorLink id={entry.target}>{content}</AnchorLink>
                        : content}
                </div>
            }
        }
    }

    return <div className="container App">
        <h1 className="title">Karta konwencyjna</h1>
        <p className="subtitle">Bartosz Bańkowski <span className="tag">13886</span><br/>Marek Jarosz <span
            className="tag">10237</span></p>

        <div className="App-openings box">
            <h4 className="title is-4">Otwarcia</h4>
            {entries.filter(entry => entry.type === 'opening').map(entry =>
                <div key={entry.sequence}>
                    <AnchorLink id={`opening-${entry.sequence}`}>
                        <b><Bid bid={polishBidToPbn(entry.sequence)}/></b>
                        <span className="App-description">{entry.description}</span>
                    </AnchorLink>
                </div>)}
        </div>
        <div className="box">
            {entries.map(renderEntry)}
        </div>
    </div>
}

export default ConventionCard
