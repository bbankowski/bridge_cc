const formatVp = vp => vp.toLocaleString('pl-PL', {maximumFractionDigits: 2})

const Pair = ({names, ours}) => ours ? <strong>{names.join(' – ')}</strong> : names.join(' – ')

const TableLine = ({label, table}) => <div className="MatchSummary-table">
    <span className="has-text-grey">{label} ({table.room}):</span>{' '}
    NS <Pair names={table.ns} ours={table.ours === 'ns'}/>{' · '}
    EW <Pair names={table.ew} ours={table.ours === 'ew'}/>
</div>

const resultClass = ([our, their]) => our > their ? 'is-success' : our < their ? 'is-danger' : ''

/*
 * The summary of a team event above the deals: the matches with their scores and who sat where at both tables.
 * A segment links to its first deal.
 */
const MatchSummary = ({tournament, deals, onSelectDeal}) => {
    const boardOf = position => deals[position - 1]?.board ?? position
    return <details className="box MatchSummary">
        <summary className="has-text-weight-bold">{tournament.name} – podsumowanie</summary>
        {tournament.matches.map(match => <div key={match.title} className="MatchSummary-match">
            <p className="mb-1">
                <span className="has-text-weight-bold">{match.title}:</span>{' '}
                {tournament.team} – {match.opponent}{' '}
                <span className={`tag is-light ${resultClass(match.imps)}`}>{match.imps.join(' : ')} IMP</span>{' '}
                {match.vp && <span className="tag is-light">{match.vp.map(formatVp).join(' : ')} VP</span>}
            </p>
            {match.segments.map(segment => <div key={segment.deals[0]} className="MatchSummary-segment">
                <button type="button" className="button is-small is-light" onClick={() => onSelectDeal(segment.deals[0] - 1)}>
                    rozdania {boardOf(segment.deals[0])}-{boardOf(segment.deals[1])}
                </button>
                <div>
                    <TableLine label="Nasz stół" table={segment.ourTable}/>
                    <TableLine label="Drugi stół" table={segment.otherTable}/>
                </div>
            </div>)}
        </div>)}
    </details>
}

export default MatchSummary
