import {Link} from 'react-router'
import './HomePage.css'
import {TOURNAMENTS} from './tournaments'

const HomePage = () => <div className="HomePage container">
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
            <ul>
                {TOURNAMENTS.map(({file, name}) =>
                    <li key={file}><Link to={{pathname: '/pbn', search: `?filename=${encodeURIComponent(file)}`}}>{name}</Link></li>
                )}
            </ul>
        </div>
    </div>
</div>

export default HomePage
