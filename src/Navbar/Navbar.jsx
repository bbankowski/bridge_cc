import {Link} from 'react-router'

const Navbar = () => <nav className="container navbar is-light" aria-label="main navigation">
    <div className="navbar-brand">
        <Link className="navbar-item" to="/">
            <img src={`${import.meta.env.BASE_URL}logo-cards.png`} width="80" alt="cards"/>
        </Link>
        <Link className="navbar-item" to="/">Home</Link>
        <Link className="navbar-item" to="/cc">Karta</Link>
        <Link className="navbar-item" to="/trening">Trening</Link>
    </div>
</nav>

export default Navbar
