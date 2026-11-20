import {Fragment, useEffect, useMemo, useState} from 'react'
import {Link, useLocation, useSearchParams} from 'react-router'
import './ConventionCard.css'
import biddingText from '../../bidding.txt?raw'
import Bid from '../common/Bid'
import {polishBidToPbn} from '../common/suits'
import BidGrid from './BidGrid'
import CardMenu from './CardMenu'
import {buildChapters, entryMatches, parseBidding, searchItems} from './bidding'
import {useScrollSpy} from './useScrollSpy'

const scrollToElement = id => document.getElementById(id)?.scrollIntoView()

const BidSequence = ({sequence}) => sequence.split('-').map((call, index) => <Fragment key={index}>
    {index > 0 && '-'}
    <Bid bid={polishBidToPbn(call)}/>
</Fragment>)

const BidTable = ({id, sequence, section, description}) => <div className="App-bidTable" id={id}>
    <div className="App-bidTableHeader">
        Licytacja po <BidSequence sequence={sequence}/>{description && `: ${description}`}
    </div>
    <BidGrid sequence={sequence} section={section}/>
</div>

// Splits the entries of a chapter into boxes: one per opening or section (and one for entries before them).
const groupByItem = chapter => {
    const leading = chapter.entries.slice(0, chapter.items.length > 0 ? chapter.entries.indexOf(chapter.items[0].entry) : undefined)
    return [...(leading.length > 0 ? [leading] : []), ...chapter.items.map(item => item.entries)]
}

const openingTitle = sequence => sequence === 'pas'
    ? 'Licytacja po pasie'
    : <>Dalsza licytacja po otwarciu <Bid bid={polishBidToPbn(sequence)}/></>

const ConventionCard = () => {
    const chapters = useMemo(() => buildChapters(parseBidding(biddingText)), [])
    const {hash} = useLocation()
    const [searchParams] = useSearchParams()
    const singleChapterId = searchParams.get('chapter')
    const [query, setQuery] = useState('')
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const chapterOf = id => chapters.find(chapter => chapter.id === id
        || chapter.entries.some(entry => entry.id === id || `line-${entry.index}` === id))

    const shownChapters = useMemo(() => {
        const single = chapters.find(chapter => chapter.id === singleChapterId)
        return single ? [single] : chapters
    }, [chapters, singleChapterId])

    const spyIds = useMemo(() => shownChapters.flatMap(chapter =>
        [...(chapter.title ? [chapter.id] : []), ...chapter.items.map(item => item.id)]), [shownChapters])
    // the section opened from the menu (or a link) stays active at the bottom of the page
    const activeId = useScrollSpy(spyIds, 100, decodeURIComponent(hash.substring(1)) || null)
    const activeChapterId = singleChapterId ?? chapterOf(activeId)?.id ?? chapters[0]?.id

    const activeEntry = chapters.flatMap(chapter => chapter.items).find(item => item.id === activeId)?.entry
    const activeLabel = activeEntry?.type === 'section' ? activeEntry.title
        : activeEntry ? openingTitle(activeEntry.sequence) : null

    const searchResults = useMemo(() => searchItems(chapters, query), [chapters, query])
    const searching = query.trim() !== ''

    useEffect(() => {
        if (hash) {
            scrollToElement(decodeURIComponent(hash.substring(1)))
        }
    }, [hash, singleChapterId])

    // In the single chapter mode, a link to another chapter switches the shown chapter.
    const linkTo = id => ({
        search: singleChapterId ? `?chapter=${chapterOf(id)?.id ?? singleChapterId}` : '',
        hash: id ?? '',
    })

    const onNavigate = id => {
        setMobileMenuOpen(false)
        if (id) {
            scrollToElement(id)
        }
    }

    const toggleSingleChapterLink = singleChapterId
        ? {search: '', hash: activeId ?? ''}
        : {search: `?chapter=${activeChapterId}`, hash: activeId ?? ''}

    const menu = <CardMenu chapters={chapters} activeId={activeId} activeChapterId={activeChapterId}
                           query={query} onQueryChange={setQuery} searchResults={searchResults}
                           singleChapter={singleChapterId !== null} toggleSingleChapterLink={toggleSingleChapterLink}
                           linkTo={linkTo} onNavigate={onNavigate}/>

    const anchorLink = (id, children) => <Link to={linkTo(id)} onClick={() => onNavigate(id)}>{children}</Link>

    const renderEntry = entry => {
        const lineId = `line-${entry.index}`
        switch (entry.type) {
            case 'section':
                return <Fragment key={entry.id}>
                    <h4 className={`title is-4${entry.description ? ' mb-2' : ''}`} id={entry.id}>{entry.title}</h4>
                    {entry.description && <p className="App-openingDescription">{entry.description}</p>}
                </Fragment>
            case 'opening':
                return <Fragment key={entry.id}>
                    <h4 className="title is-4 mb-2" id={entry.id}>{openingTitle(entry.sequence)}</h4>
                    {entry.description && entry.sequence !== 'pas'
                        && <p className="App-openingDescription">{entry.description}</p>}
                </Fragment>
            case 'table':
                return <BidTable key={entry.id} {...entry}/>
            default: {
                const lastCall = entry.sequence.substring(entry.sequence.lastIndexOf('-') + 1)
                const content = <><b><Bid bid={polishBidToPbn(lastCall)}/></b>
                    <span className="App-description">{entry.description}</span></>
                const className = 'App-bidLine' + (searching && entryMatches(entry, query) ? ' is-search-match' : '')
                return <div key={lineId} id={lineId} className={className} style={{'--level': entry.level}}>
                    {entry.target ? anchorLink(entry.target, content) : content}
                </div>
            }
        }
    }

    const renderOpeningsOverview = openings => <div className="App-openings box">
        <h4 className="title is-5">Przegląd otwarć</h4>
        {openings.map(entry => <div key={entry.id}>
            {anchorLink(entry.id, <>
                <b><Bid bid={polishBidToPbn(entry.sequence)}/></b>
                <span className="App-description">{entry.short ?? entry.description}</span>
            </>)}
        </div>)}
    </div>

    return <div className="container App ConventionCard">
        <div className="ConventionCard-header">
            <h1 className="title">Karta konwencyjna</h1>
            <Link className="button is-small is-light" to="/karta-pzbs">Karta PZBS do druku</Link>
        </div>
        <p className="subtitle">Bartosz Bańkowski <span className="tag">13886</span><br/>Marek Jarosz <span
            className="tag">10237</span></p>

        <div className="ConventionCard-mobileBar is-hidden-tablet">
            <button className="button is-light is-fullwidth" aria-expanded={mobileMenuOpen}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? '✕ Zamknij spis treści' : <>☰&nbsp;{activeLabel ?? 'Spis treści'}</>}
            </button>
            {mobileMenuOpen && <div className="ConventionCard-mobileMenu box">{menu}</div>}
        </div>

        <div className="columns">
            <div className="column is-3 is-hidden-mobile">
                <div className="ConventionCard-sidebar">{menu}</div>
            </div>
            <div className="column">
                {shownChapters.map(chapter => {
                    const openings = chapter.entries.filter(entry => entry.type === 'opening' && entry.sequence !== 'pas')
                    return <section key={chapter.id} className="ConventionCard-chapter" id={chapter.title ? chapter.id : undefined}>
                        {chapter.title && <h2 className="title is-3 ConventionCard-chapterTitle">{chapter.title}</h2>}
                        {openings.length > 0 && renderOpeningsOverview(openings)}
                        {groupByItem(chapter).map((group, index) =>
                            <div key={group[0]?.id ?? index} className="box">{group.map(renderEntry)}</div>)}
                    </section>
                })}
            </div>
        </div>
    </div>
}

export default ConventionCard
