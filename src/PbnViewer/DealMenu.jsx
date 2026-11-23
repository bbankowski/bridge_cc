import {useEffect, useRef, useState} from 'react'

/*
 * The "⋮" menu in the top right corner of a deal: editing the deal and downloading the file. A dot on the button
 * marks edits that were not downloaded yet.
 */
const DealMenu = ({canEdit, isModified, onEdit, onDownload}) => {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        if (!open) {
            return
        }
        const onClick = event => !ref.current?.contains(event.target) && setOpen(false)
        const onKeyDown = event => event.key === 'Escape' && setOpen(false)
        document.addEventListener('mousedown', onClick)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('mousedown', onClick)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open])

    const choose = action => () => {
        setOpen(false)
        action()
    }

    return <div ref={ref} className={`dropdown is-right DealMenu${open ? ' is-active' : ''}`}>
        <div className="dropdown-trigger">
            <button type="button" className="button is-small is-white DealMenu-trigger" aria-label="Menu rozdania"
                    aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(!open)}
                    title={isModified ? 'Są niepobrane zmiany w rozdaniach' : undefined}>
                ⋮{isModified && <span className="DealMenu-modified" aria-hidden="true"/>}
            </button>
        </div>
        {open && <div className="dropdown-menu" role="menu">
            <div className="dropdown-content">
                <button type="button" role="menuitem" className="dropdown-item" disabled={!canEdit} onClick={choose(onEdit)}>
                    Edytuj rozdanie
                </button>
                <button type="button" role="menuitem" className="dropdown-item" onClick={choose(onDownload)}>
                    Pobierz PBN{isModified && ' *'}
                </button>
            </div>
        </div>}
    </div>
}

export default DealMenu
