import {Link} from 'react-router'
import './Pzbs.css'
import biddingText from '../../../bidding.txt?raw'
import data from '../../../karta-pzbs.json'
import MiniCard from './MiniCard'
import {defenceAfter1NT, missingFields} from './pzbsCard'

// The PZBS "minikarta konwencyjna" to print: one A4 page with two copies, one for each opponent.
const PzbsCardPage = () => {
    const defence = defenceAfter1NT(biddingText, data.obronaPo1BA.sekcja)
    const missing = missingFields(data)
    return <div className="PzbsCardPage">
        <div className="PzbsCardPage-toolbar container">
            <h1 className="title is-4 mb-2">Minikarta konwencyjna PZBS</h1>
            <p className="mb-2">Dwie kopie na stronie A4 – po jednej dla każdego przeciwnika. Wydrukuj albo zapisz jako PDF.</p>
            <div className="buttons">
                <button type="button" className="button is-primary" onClick={() => window.print()}>Drukuj / zapisz PDF</button>
                <Link className="button is-light" to="/cc">Wróć do karty</Link>
            </div>
            {!defence && <div className="notification is-danger is-light">
                W bidding.txt nie ma sekcji „{data.obronaPo1BA.sekcja}” – obrona po 1BA jest pusta.
            </div>}
            {missing.length > 0 && <div className="notification is-warning is-light">
                <p className="mb-1"><strong>Do uzupełnienia w karta-pzbs.json</strong> (na wydruku zostaną puste):</p>
                <ul>{missing.map(label => <li key={label}>{label}</li>)}</ul>
            </div>}
        </div>
        <div className="PzbsCardPage-sheet">
            <MiniCard data={data} defence={defence}/>
            <MiniCard data={data} defence={defence}/>
        </div>
    </div>
}

export default PzbsCardPage
