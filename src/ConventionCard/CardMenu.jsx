import {useEffect, useRef} from 'react'
import {Link} from 'react-router'
import Bid from '../common/Bid'
import {polishBidToPbn} from '../common/suits'

const itemLabel = entry => {
    if (entry.type === 'section') {
        return entry.title
    }
    return entry.sequence === 'pas' ? 'Po pasie' : <Bid bid={polishBidToPbn(entry.sequence)}/>
}

/*
 * Table of contents of the convention card: chapters with their openings and sections, a search box and a switch
 * between the whole card and a single chapter.
 */
const CardMenu = ({
                      chapters, activeId, activeChapterId, query, onQueryChange, searchResults,
                      singleChapter, toggleSingleChapterLink, linkTo, onNavigate,
                  }) => {
    const activeLink = useRef(null)
    const searching = query.trim() !== ''

    useEffect(() => {
        activeLink.current?.scrollIntoView?.({block: 'nearest'})
    }, [activeId])

    const renderItem = item => {
        const result = searchResults.get(item.id)
        if (searching && !result) {
            return null
        }
        const target = !searching ? item.id : (result.first.type === 'bid' ? `line-${result.first.index}` : result.first.id)
        const isActive = !searching && item.id === activeId
        const isOpening = item.entry.type === 'opening' && item.entry.sequence !== 'pas'
        return <li key={item.id} className={isOpening ? 'CardMenu-opening' : undefined}>
            <Link to={linkTo(target)} onClick={() => onNavigate(target)} className={isActive ? 'is-active' : undefined}
                  ref={isActive ? activeLink : undefined} aria-current={isActive ? 'location' : undefined}>
                {itemLabel(item.entry)}
                {result && searching && <span className="tag is-warning is-light ml-1">{result.count}</span>}
            </Link>
        </li>
    }

    return <aside className="menu CardMenu">
        <div className="field has-addons mb-2">
            <div className="control is-expanded">
                <input className="input is-small" type="search" placeholder="Szukaj, np. transfer albo 1BA-2C"
                       aria-label="Szukaj w karcie" value={query} onChange={e => onQueryChange(e.target.value)}/>
            </div>
        </div>
        <div className="buttons are-small mb-2">
            <Link className="button is-light is-fullwidth" to={toggleSingleChapterLink}
                  onClick={() => onNavigate(toggleSingleChapterLink.hash || null)}>
                {singleChapter ? 'Pokaż całą kartę' : 'Pokaż tylko ten rozdział'}
            </Link>
        </div>
        {chapters.map(chapter => {
            const items = chapter.items.map(renderItem).filter(Boolean)
            if (searching && items.length === 0) {
                return null
            }
            const expanded = searching || chapter.id === activeChapterId
            const openings = items.filter(item => item.props.className === 'CardMenu-opening')
            const others = items.filter(item => item.props.className !== 'CardMenu-opening')
            return <div key={chapter.id} className="CardMenu-chapter">
                {chapter.title && <p className="menu-label">
                    <Link to={linkTo(chapter.id)} onClick={() => onNavigate(chapter.id)}
                          className={chapter.id === activeChapterId ? 'has-text-link' : undefined}>
                        {chapter.title}
                    </Link>
                </p>}
                {expanded && <>
                    {openings.length > 0 && <ul className="menu-list CardMenu-openings">{openings}</ul>}
                    {others.length > 0 && <ul className="menu-list">{others}</ul>}
                </>}
            </div>
        })}
        {searching && searchResults.size === 0 && <p className="has-text-grey is-size-7">Brak wyników.</p>}
        <p className="mt-3 is-size-7">
            <a href="#top" onClick={e => {
                e.preventDefault()
                window.scrollTo({top: 0})
                onNavigate(null)
            }}>↑ Na górę</a>
        </p>
    </aside>
}

export default CardMenu
