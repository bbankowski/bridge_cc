import {useEffect, useState} from 'react'
import {Link} from 'react-router'
import './HomePage.css'

// The tournaments of the PBN viewer, from public/tournaments.json: [{file, name}].
const useTournaments = () => {
    const [state, setState] = useState({tournaments: [], error: null})
    useEffect(() => {
        let cancelled = false
        fetch('tournaments.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Nie udało się pobrać listy turniejów (${response.status})`)
                }
                return response.json()
            })
            .then(tournaments => !cancelled && setState({tournaments, error: null}))
            .catch(e => !cancelled && setState({tournaments: [], error: e.message}))
        return () => {
            cancelled = true
        }
    }, [])
    return state
}

const HomePage = () => {
    const {tournaments, error} = useTournaments()
    return <div className="HomePage container">
        <div className="box">
            <div className="content">
                <p>Convention Card Viewer:</p>
                <ul>
                    <li><Link to="/cc">BB i MJ</Link></li>
                </ul>
            </div>
            <div className="content">
                <p>Trening:</p>
                <ul>
                    <li><Link to="/trening">Testy z karty, otwarć i sytuacji z turniejów</Link></li>
                </ul>
            </div>
            <div className="content">
                <p>PBN Viewer:</p>
                {error && <p className="has-text-danger">{error}</p>}
                <ul>
                    {tournaments.map(({file, name}) =>
                        <li key={file}><Link to={{pathname: '/pbn', search: `?filename=${encodeURIComponent(file)}`}}>{name}</Link></li>
                    )}
                </ul>
            </div>
        </div>
    </div>
}

export default HomePage
