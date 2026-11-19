import {useEffect, useRef, useState} from 'react'
import {formatText} from './formatText'

const CommentEditor = ({commentText, onSave}) => {
    const [draft, setDraft] = useState(null)
    const isEditing = draft !== null
    const textareaRef = useRef(null)

    useEffect(() => {
        const textarea = textareaRef.current
        if (isEditing && textarea) {
            // start typing at the end of the comment
            textarea.focus()
            textarea.setSelectionRange(textarea.value.length, textarea.value.length)
        }
    }, [isEditing])

    const save = () => {
        onSave(draft)
        setDraft(null)
    }

    const onKeyDown = event => {
        if (event.key === 'Escape') {
            setDraft(null)
        } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            save()
        }
    }

    return <div className="App-deal-comment">
        <div className="App-deal-comment-header">
            <strong>Komentarz:</strong>
            {!isEditing && <button className="button is-small is-light" onClick={() => setDraft(commentText)}>
                Edytuj
            </button>}
        </div>
        {isEditing ? <>
            <textarea className="textarea" value={draft} onChange={e => setDraft(e.target.value)}
                      onKeyDown={onKeyDown} ref={textareaRef}/>
            <div className="buttons are-small App-deal-comment-buttons">
                <button className="button is-primary" onClick={save}>Zapisz</button>
                <button className="button is-light" onClick={() => setDraft(null)}>Anuluj</button>
                <span className="help">Ctrl+Enter zapisuje, Esc anuluje. Zmiany trafiają do pliku po „Pobierz PBN”.</span>
            </div>
        </> : <p className="Comment">{formatText(commentText)}</p>}
    </div>
}

export default CommentEditor
