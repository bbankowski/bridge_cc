import {useEffect, useState} from 'react'

// Returns the id of the last element (in document order) whose top has scrolled above the given offset.
// At the bottom of the page the last sections cannot reach the top: then the preferred element (the one the user
// navigated to) wins if it is visible, otherwise the last visible element.
export const useScrollSpy = (ids, offset = 100, preferredId = null) => {
    const [activeId, setActiveId] = useState(ids[0] ?? null)

    useEffect(() => {
        let frame = null
        const update = () => {
            frame = null
            // at the bottom of the page the last sections cannot reach the top, so take the last visible one
            const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
            const limit = atBottom ? window.innerHeight : offset
            let current = ids[0] ?? null
            for (const id of ids) {
                const element = document.getElementById(id)
                if (element && element.getBoundingClientRect().top <= limit) {
                    current = id
                }
            }
            const preferred = atBottom && ids.includes(preferredId) ? document.getElementById(preferredId) : null
            if (preferred) {
                const top = preferred.getBoundingClientRect().top
                if (top >= 0 && top < window.innerHeight) {
                    current = preferredId
                }
            }
            setActiveId(current)
        }
        const onScroll = () => {
            if (frame === null) {
                frame = requestAnimationFrame(update)
            }
        }
        update()
        window.addEventListener('scroll', onScroll, {passive: true})
        window.addEventListener('resize', onScroll)
        return () => {
            window.removeEventListener('scroll', onScroll)
            window.removeEventListener('resize', onScroll)
            if (frame !== null) {
                cancelAnimationFrame(frame)
            }
        }
    }, [ids, offset, preferredId])

    return activeId
}
