import {Link} from 'react-router'
import Bid from '../common/Bid'
import BidGrid from '../ConventionCard/BidGrid'
import BiddingBox from './BiddingBox'
import {nextSeat, SEATS} from './calls'
import HandView, {CardLabel} from './HandView'
import {isCorrect} from './questions'

const SCORING_LABELS = {IMP: 'Mecz (IMP)', maxy: 'Turniej na maksy'}
const AUTHOR_LABELS = {MK: 'Trener (MK)', 'MK+MJ': 'Trener (MK) i MJ', MJ: 'MJ'}

const callLabel = call => (call === 'Pass' ? 'pas' : call?.endsWith('NT') ? call.replace('NT', 'BA') : <Bid bid={call}/>)

export const AnswerLabel = ({question, value}) => {
    if (question.kind === 'card') {
        return <CardLabel card={value}/>
    }
    if (question.kind === 'call') {
        return callLabel(value)
    }
    return value
}

const Context = ({context}) => {
    if (!context) {
        return null
    }
    const usVulnerable = context.vulnerable.includes(context.seat)
    const themVulnerable = context.vulnerable.includes(nextSeat(context.seat))
    return <div className="tags Training-context">
        {context.scoring !== undefined && <span className="tag is-light">
            {SCORING_LABELS[context.scoring] ?? 'Forma rozgrywek nieznana'}
        </span>}
        <span className={`tag ${usVulnerable ? 'is-danger' : 'is-success'} is-light`}>My: {usVulnerable ? 'po partii' : 'przed partią'}</span>
        <span className={`tag ${themVulnerable ? 'is-danger' : 'is-success'} is-light`}>Oni: {themVulnerable ? 'po partii' : 'przed partią'}</span>
        <span className="tag is-light">Rozdaje: {context.dealer}</span>
        <span className="tag is-light">Siedzisz na: {context.seat}</span>
    </div>
}

// A real auction in N/E/S/W columns, with "?" where the player is to call (or the whole auction for a lead).
const AuctionTable = ({auction, showQuestion}) => {
    const cells = Array(SEATS.indexOf(auction.firstSeat)).fill(null)
    auction.calls.forEach(({call}) => cells.push(call))
    if (showQuestion) {
        cells.push('?')
    }
    while (cells.length % 4 !== 0) {
        cells.push(null)
    }
    const rows = []
    for (let i = 0; i < cells.length; i += 4) {
        rows.push(cells.slice(i, i + 4))
    }
    return <table className="BidGrid Training-auction">
        <thead>
        <tr>{SEATS.map(seat => <th key={seat} className={seat === auction.seat ? 'is-our-seat' : undefined}>
            {seat}{seat === auction.seat ? ' (ty)' : ''}</th>)}</tr>
        </thead>
        <tbody>
        {rows.map((row, rowIndex) => <tr key={rowIndex}>
            {row.map((call, index) => <td key={index} className={call === '?' ? 'is-highlighted' : undefined}>
                {call === null ? '' : call === '?' ? '?' : callLabel(call)}
            </td>)}
        </tr>)}
        </tbody>
    </table>
}

const scoreLabel = score => score === 100 ? 'Dobrze' : isCorrect(score) ? 'Dobrze (nie najlepiej)' : score > 0 ? 'Częściowo' : 'Źle'
const scoreClass = score => isCorrect(score) ? 'is-success' : score > 0 ? 'is-warning' : 'is-danger'

const Feedback = ({question, result}) => {
    const answers = [...question.answers].sort((a, b) => b.score - a.score)
    const unlisted = !result.answer
    return <div className={`notification ${scoreClass(result.score)} is-light Training-feedback`}>
        <p className="is-size-5 mb-2"><strong>{scoreLabel(result.score)}</strong> · {result.score}/100</p>
        {question.kind === 'choice'
            ? <p>Poprawnie: <strong>{answers[0].value}</strong></p>
            : <>
                <p>Twoja odpowiedź: <strong><AnswerLabel question={question} value={result.value}/></strong>
                    {unlisted && ' – tej odpowiedzi nie oceniano, liczy się jako błędna'}</p>
                <table className="table is-narrow is-fullwidth Training-options">
                    <tbody>
                    {answers.map(answer => <tr key={answer.value}
                                               className={answer === result.answer ? 'is-selected-answer' : undefined}>
                        <td className="Training-optionValue"><AnswerLabel question={question} value={answer.value}/></td>
                        <td className="Training-optionScore">{answer.score}</td>
                        <td>{answer.comment}</td>
                    </tr>)}
                    </tbody>
                </table>
            </>}
        {question.played && <p>Przy stole: <strong><AnswerLabel question={question} value={question.played}/></strong></p>}
        {question.explanation && <p className="mt-2">{question.explanation}</p>}
        <p className="mt-2 is-size-7">
            {question.context?.author && <span className="tag is-white mr-2">{AUTHOR_LABELS[question.context.author] ?? question.context.author}</span>}
            {question.context?.event && <span className="mr-2">{question.context.event}, rozdanie {question.context.board}</span>}
            {question.links?.map(link => <Link key={link.label} className="mr-3" to={link.to}>{link.label} →</Link>)}
        </p>
    </div>
}

const QuestionView = ({question, result, onAnswer}) => {
    const answered = result !== null
    return <div className="Training-question">
        <h2 className="title is-4 mb-1">{question.title}</h2>
        {question.subtitle && <p className="has-text-grey mb-2">{question.subtitle}</p>}
        <Context context={question.context}/>

        <div className="Training-board">
            {question.cardAuction && <BidGrid sequence={question.cardAuction.sequence} section={question.cardAuction.section}
                                              withoutQuestion={question.cardAuction.highlightLast}
                                              highlightLast={question.cardAuction.highlightLast}/>}
            {!question.cardAuction && question.auction && <AuctionTable auction={question.auction}
                                                                        showQuestion={question.kind === 'call'}/>}
            {question.hand && <div>
                <p className="has-text-grey is-size-7 mb-1">Twoja ręka</p>
                <HandView hand={question.hand} disabled={answered} selected={answered ? result.value : null}
                          onSelectCard={question.kind === 'card' ? onAnswer : undefined}/>
            </div>}
        </div>
        {question.prompt && <p className="Training-prompt">{question.prompt}</p>}

        {question.kind === 'choice' && <div className="Training-choices">
            {question.choices.map(choice => {
                const answer = question.answers.find(a => a.value === choice)
                const state = !answered ? '' : answer.score === 100 ? 'is-success' : choice === result.value ? 'is-danger' : ''
                return <button key={choice} type="button" disabled={answered} onClick={() => onAnswer(choice)}
                               className={`button is-fullwidth Training-choice ${state}`}>{choice}</button>
            })}
        </div>}
        {question.kind === 'call' && !answered && <BiddingBox calls={question.auction.calls} seat={question.auction.seat}
                                                              onSelect={onAnswer}/>}
        {question.kind === 'card' && !answered && <p className="has-text-grey">Kliknij kartę, którą wistujesz.</p>}

        {answered && <Feedback question={question} result={result}/>}
    </div>
}

export default QuestionView
