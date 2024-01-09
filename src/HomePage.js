import React from 'react';
import './HomePage.css';

function HomePage() {
    return (
        <div className="HomePage">
            <nav>
                <ul>
                    <li>
                        <a href={`/cc`}>Karta konwencyjna</a>
                    </li>
                    <li>
                        <a href={`/pbn`}>PBN Viewer</a>
                    </li>
                </ul>
            </nav>
        </div>
    );
}

export default HomePage;
