import React from 'react';
import './HomePage.css';

function HomePage() {
    return (
        <div className="HomePage container">
            <div className="box">
                <div className="content">
                    <p>Convention Card Viewer:</p>
                    <ul>
                        <li><a href={'/bridge_cc/#/cc'}>BB i MJ</a></li>
                    </ul>
                </div>
                <div className="content">
                    <p>PBN Viewer:</p>
                    <ul>
                        <li><a href={'/bridge_cc/#/pbn?filename=4kroli.pbn'}>2024.01.07 Czterech Króli</a></li>
                        <li><a href={'/bridge_cc/#/pbn?filename=2024.01.01-TreningCKiS.pbn'}>2024.01.11 Trening CKiS Skawina BBO</a></li>
                        <li><a href={'/bridge_cc/#/pbn?filename=2liga_3zjazd.pbn'}>2024.01.20-21 Trzeci zjazd II ligi</a></li>
                        <li><a href={'/bridge_cc/#/pbn?filename=2024.02.28-Mindlab.pbn'}>2024.02.28 Mindlab</a></li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default HomePage;
