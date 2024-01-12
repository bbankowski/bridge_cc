import './Navbar.css';

const Navbar = () => {

    return <nav className="container navbar is-light" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
            <a className="navbar-item" href={"/bridge_cc/"}>
                <img src={"logo-cards.png"} width="80" alt="cards"/>
            </a>

            <a role="button" className="navbar-burger" aria-label="menu" aria-expanded="false"
               data-target="navbarBasicExample">
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
            </a>
        </div>

        <div id="navbarBasicExample" className="navbar-menu">
            <div className="navbar-start">
                <a className="navbar-item" href={"/bridge_cc/"}>Home</a>
            </div>
        </div>
    </nav>
}

export default Navbar;
