import {Link} from 'react-router'
import './Pzbs.css'
import data from '../../../karta-pzbs.json'
import {OpeningsPage, OutsidePage} from './FullCard'
import {missingFields} from './pzbsCard'

// The PZBS convention card to print: two A4 landscape pages (outside with the cover, inside with the openings).
const PzbsCardPage = () => {
    const missing = missingFields(data)
    return <div className="PzbsCardPage">
        <div className="PzbsCardPage-toolbar container">
            <h1 className="title is-4 mb-2">Karta konwencyjna PZBS</h1>
            <p className="mb-2">
                Dwie strony A4 w poziomie – wydrukuj dwustronnie (obracanie wzdłuż krótszej krawędzi) i złóż na pół,
                albo zapisz jako PDF. Treść jest w <code>karta-pzbs.json</code>.
            </p>
            <div className="buttons">
                <button type="button" className="button is-primary" onClick={() => window.print()}>Drukuj / zapisz PDF</button>
                <Link className="button is-light" to="/cc">Wróć do karty</Link>
            </div>
            {missing.length > 0 && <div className="notification is-warning is-light">
                <p className="mb-1"><strong>Do uzupełnienia w karta-pzbs.json</strong> (na wydruku zostaną puste):</p>
                <ul>{missing.map(label => <li key={label}>{label}</li>)}</ul>
            </div>}
        </div>
        <div className="PzbsCardPage-sheets">
            <OutsidePage data={data}/>
            <OpeningsPage data={data}/>
        </div>
    </div>
}

export default PzbsCardPage
