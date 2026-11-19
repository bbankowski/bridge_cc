import {useEffect, useMemo, useState} from 'react'
import './Training.css'
import biddingText from '../../bidding.txt?raw'
import situations from '../../trening/sytuacje.json'
import QuestionView, {AnswerLabel} from './QuestionView'
import {loadProgress, recordAnswer, recordSession, reviewQuestions, saveProgress} from './progress'
import {cardOpeningDescriptions, grade, isCorrect, MODES, prepareCard} from './questions'
import {availableModes, buildSession} from './session'

const SESSION_KEY = 'bridge-training-session'
const COUNTS = [5, 10, 20]

const loadSession = () => {
    try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null')
    } catch {
        return null
    }
}

const storeSession = session => {
    try {
        if (session) {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
        } else {
            sessionStorage.removeItem(SESSION_KEY)
        }
    } catch {
        // the test is kept only in memory
    }
}

const average = results => Math.round(results.reduce((sum, r) => sum + r.score, 0) / Math.max(results.length, 1))

const MODE_DESCRIPTIONS = {
    karta: 'Znaczenie sekwencji z karty i odwrotnie – co zalicytować.',
    otwarcia: 'Losowe ręce do otwarcia, w losowych założeniach.',
    turnieje: 'Prawdziwe decyzje z turniejów z ocenami trenera.',
    wisty: 'Wisty z turniejów z ocenami trenera.',
    mieszany: 'Wszystko po trochu.',
    powtorka: 'Pytania, na które źle odpowiedziałeś.',
}

const StartScreen = ({sources, progress, onStart, onResetProgress}) => {
    const [mode, setMode] = useState('mieszany')
    const [count, setCount] = useState(10)
    const [chapterId, setChapterId] = useState('')
    const [scoring, setScoring] = useState('')
    const [includeReview, setIncludeReview] = useState(true)
    const [confirmReset, setConfirmReset] = useState(false)
    const available = availableModes(sources)
    const reviewCount = sources.review.length
    const counts = {
        karta: `${sources.card.playable.length} sekwencji`,
        otwarcia: 'bez limitu',
        turnieje: `${sources.situations.filter(s => s.type === 'bid').length} sytuacji`,
        wisty: `${sources.situations.filter(s => s.type === 'lead').length} sytuacji`,
        mieszany: '',
        powtorka: `${reviewCount} do powtórki`,
    }
    const modes = ['karta', 'otwarcia', 'turnieje', 'wisty', 'mieszany', 'powtorka']
        .filter(m => m === 'mieszany' || (m === 'powtorka' ? reviewCount > 0 : available[m]))
    const categories = Object.entries(progress.categories).sort(([a], [b]) => a.localeCompare(b, 'pl'))

    return <div className="Training-start">
        <div className="box">
            <h2 className="title is-5">Co trenujesz?</h2>
            <div className="Training-modes">
                {modes.map(m => <button key={m} type="button" aria-pressed={mode === m}
                                        className={`button Training-mode ${mode === m ? 'is-link' : 'is-light'}`}
                                        onClick={() => setMode(m)}>
                    <strong>{MODES[m] ?? (m === 'mieszany' ? 'Mieszany' : 'Powtórka błędów')}</strong>
                    <span className="is-size-7">{MODE_DESCRIPTIONS[m]}</span>
                    {counts[m] && <span className="is-size-7 Training-modeCount">{counts[m]}</span>}
                </button>)}
            </div>

            <div className="Training-settings">
                <div className="field">
                    <label className="label is-small">Liczba pytań</label>
                    <div className="buttons has-addons">
                        {COUNTS.map(c => <button key={c} type="button" aria-pressed={count === c}
                                                 className={`button is-small ${count === c ? 'is-link' : ''}`}
                                                 onClick={() => setCount(c)}>{c}</button>)}
                    </div>
                </div>
                {mode === 'karta' && <div className="field">
                    <label className="label is-small" htmlFor="training-chapter">Rozdział karty</label>
                    <div className="select is-small">
                        <select id="training-chapter" value={chapterId} onChange={e => setChapterId(e.target.value)}>
                            <option value="">Wszystkie</option>
                            {sources.card.chapters.filter(c => c.title).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </div>
                </div>}
                {(mode === 'turnieje' || mode === 'wisty' || mode === 'mieszany') && <div className="field">
                    <label className="label is-small" htmlFor="training-scoring">Forma rozgrywek</label>
                    <div className="select is-small">
                        <select id="training-scoring" value={scoring} onChange={e => setScoring(e.target.value)}>
                            <option value="">Wszystkie</option>
                            <option value="IMP">Mecze (IMP)</option>
                            <option value="maxy">Turnieje na maksy</option>
                        </select>
                    </div>
                </div>}
                {mode !== 'powtorka' && reviewCount > 0 && <label className="checkbox">
                    <input type="checkbox" checked={includeReview} onChange={e => setIncludeReview(e.target.checked)}/>
                    {' '}Dołącz pytania do powtórki ({reviewCount})
                </label>}
            </div>

            <button type="button" className="button is-primary is-medium mt-3"
                    onClick={() => onStart({mode, count, chapterId: chapterId || null, scoring: scoring || null, includeReview})}>
                Zaczynamy
            </button>
        </div>

        {(categories.length > 0 || progress.sessions.length > 0) && <div className="box">
            <h2 className="title is-5">Twoje wyniki</h2>
            <p className="is-size-7 has-text-grey mb-2">Zapisane w tej przeglądarce.</p>
            <div className="columns">
                <div className="column">
                    <table className="table is-narrow is-fullwidth">
                        <thead><tr><th>Kategoria</th><th className="has-text-right">Pytań</th><th className="has-text-right">Średnio</th></tr></thead>
                        <tbody>
                        {categories.map(([category, {answered, scoreSum}]) => <tr key={category}>
                            <td>{category}</td>
                            <td className="has-text-right">{answered}</td>
                            <td className="has-text-right">
                                <span className={`tag ${scoreSum / answered >= 70 ? 'is-success' : 'is-warning'} is-light`}>
                                    {Math.round(scoreSum / answered)}%
                                </span>
                            </td>
                        </tr>)}
                        </tbody>
                    </table>
                </div>
                <div className="column is-4">
                    <p className="has-text-weight-bold mb-1">Ostatnie testy</p>
                    <ul className="is-size-7">
                        {progress.sessions.slice(0, 8).map(s => <li key={s.date}>
                            {new Date(s.date).toLocaleDateString('pl-PL')} · {MODES[s.mode] ?? s.mode} · {s.count} pyt. · <strong>{s.score}%</strong>
                        </li>)}
                    </ul>
                </div>
            </div>
            {confirmReset
                ? <div className="buttons are-small">
                    <span className="mr-2">Na pewno usunąć wszystkie wyniki i powtórki?</span>
                    <button type="button" className="button is-danger" onClick={() => {
                        onResetProgress()
                        setConfirmReset(false)
                    }}>Usuń</button>
                    <button type="button" className="button" onClick={() => setConfirmReset(false)}>Anuluj</button>
                </div>
                : <button type="button" className="button is-small is-light" onClick={() => setConfirmReset(true)}>Wyczyść wyniki</button>}
        </div>}
    </div>
}

const Summary = ({session, onRepeatWrong, onNew}) => {
    const wrong = session.questions.filter((q, index) => !isCorrect(session.results[index].score))
    return <div className="box">
        <h2 className="title is-4">Wynik: {average(session.results)}%</h2>
        <p className="mb-3">Dobrze: {session.results.filter(r => isCorrect(r.score)).length} z {session.results.length}</p>
        <table className="table is-fullwidth is-narrow">
            <tbody>
            {session.questions.map((question, index) => <tr key={question.id}>
                <td>{index + 1}.</td>
                <td>{question.title}<br/><span className="is-size-7 has-text-grey">{question.category}</span></td>
                <td><AnswerLabel question={question} value={session.results[index].value}/></td>
                <td className="has-text-right">
                    <span className={`tag is-light ${isCorrect(session.results[index].score) ? 'is-success' : 'is-danger'}`}>
                        {session.results[index].score}
                    </span>
                </td>
            </tr>)}
            </tbody>
        </table>
        <div className="buttons">
            {wrong.length > 0 && <button type="button" className="button is-primary" onClick={() => onRepeatWrong(wrong)}>
                Powtórz błędne ({wrong.length})
            </button>}
            <button type="button" className="button is-light" onClick={onNew}>Nowy test</button>
        </div>
    </div>
}

const TrainingPage = () => {
    const card = useMemo(() => prepareCard(biddingText), [])
    const openingDescriptions = useMemo(() => cardOpeningDescriptions(card), [card])
    const [progress, setProgress] = useState(() => loadProgress())
    const [session, setSession] = useState(() => loadSession())

    useEffect(() => storeSession(session), [session])
    useEffect(() => saveProgress(progress), [progress])

    const sources = {card, openingDescriptions, situations, review: reviewQuestions(progress)}

    const start = options => {
        const questions = buildSession(options, sources)
        setSession({mode: options.mode, questions, results: [], current: null})
    }

    const answer = value => {
        const question = session.questions[session.results.length]
        const result = {value, ...grade(question, value)}
        setSession({...session, current: result})
        setProgress(recordAnswer(progress, question, result.score))
    }

    const next = () => {
        const results = [...session.results, session.current]
        const finished = {...session, results, current: null}
        setSession(finished)
        if (results.length === session.questions.length) {
            setProgress(previous => recordSession(previous, finished))
        }
    }

    const index = session?.results.length ?? 0
    const finished = session && index === session.questions.length

    return <div className="container App Training">
        <h1 className="title">Trening</h1>
        {!session && <StartScreen sources={sources} progress={progress} onStart={start}
                                  onResetProgress={() => setProgress({categories: {}, review: {}, sessions: []})}/>}
        {session && session.questions.length === 0 && <div className="notification is-warning">
            Brak pytań dla wybranych ustawień.
            <button type="button" className="button is-small ml-3" onClick={() => setSession(null)}>Wróć</button>
        </div>}
        {session && !finished && <div className="box">
            <div className="Training-progress">
                <progress className="progress is-small is-link" value={index} max={session.questions.length}/>
                <span className="is-size-7">Pytanie {index + 1} z {session.questions.length}</span>
                <button type="button" className="button is-small is-white" onClick={() => setSession(null)}>Przerwij</button>
            </div>
            <QuestionView key={session.questions[index].id} question={session.questions[index]}
                          result={session.current} onAnswer={answer}/>
            {session.current && <button type="button" className="button is-primary mt-3" onClick={next} autoFocus>
                {index + 1 === session.questions.length ? 'Pokaż wynik' : 'Dalej'}
            </button>}
        </div>}
        {finished && session.questions.length > 0 && <Summary session={session}
            onRepeatWrong={wrong => setSession({mode: 'powtorka', questions: wrong, results: [], current: null})}
            onNew={() => setSession(null)}/>}
    </div>
}

export default TrainingPage
