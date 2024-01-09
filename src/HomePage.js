import React from 'react';
import './HomePage.css';

function HomePage() {
    return (
        <div className="HomePage">
            <nav>
                <ul>
                    <li>
                        <a href={'/bridge_cc/cc'}>Karta konwencyjna</a>
                    </li>
                    <li>
                        <a href={'/bridge_cc/pbn?filename=4kroli.pbn'}>PBN Viewer</a>
                    </li>
                </ul>
            </nav>
        </div>
    );
}

export default HomePage;
