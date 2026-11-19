import {Link} from 'react-router'
import './HomePage.css'

const TOURNAMENTS = [
    {file: '4kroli.pbn', name: '2024.01.07 Czterech Króli'},
    {file: '2024.01.01-TreningCKiS.pbn', name: '2024.01.11 Trening CKiS Skawina BBO'},
    {file: '2liga_3zjazd.pbn', name: '2024.01.20-21 Trzeci zjazd II ligi'},
    {file: '2024.02.28-Mindlab.pbn', name: '2024.02.28 Mindlab'},
    {file: '2024.03.27-Mindlab.pbn', name: '2024.03.27 Mindlab'},
    {file: '2024.04.03-Mindlab.pbn', name: '2024.04.03 Mindlab'},
    {file: '2024.04.06-RewersJoker.pbn', name: '2024.04.06 II liga play-off vs Rewers Joker (2 i 3 składka)'},
    {file: '2024.06.23-Slawa_GPP.pbn', name: '2024.06.23 GPPP w Sławie'},
    {file: '3liga_2025-2026_3zjazd.pbn', name: '3 liga 2025/2026 - 3 zjazd'},
]

const HomePage = () => <div className="HomePage container">
    <div className="box">
        <div className="content">
            <p>Convention Card Viewer:</p>
            <ul>
                <li><Link to="/cc">BB i MJ</Link></li>
            </ul>
        </div>
        <div className="content">
            <p>PBN Viewer:</p>
            <ul>
                {TOURNAMENTS.map(({file, name}) =>
                    <li key={file}><Link to={{pathname: '/pbn', search: `?filename=${encodeURIComponent(file)}`}}>{name}</Link></li>
                )}
            </ul>
        </div>
    </div>
</div>

export default HomePage
