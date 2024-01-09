import React from 'react';
import './HomePage.css';

function HomePage() {
    return (
        <div className="HomePage container">
            <div className="box">
                <div className="content"><a href={'/bridge_cc/#/cc'}>Karta konwencyjna</a></div>
                <div className="content">
                    <p>PBN Viewer:</p>
                    <ul>
                        <li><a href={'/bridge_cc/#/pbn?filename=4kroli.pbn'}>Czterech Króli 07.01.2024</a></li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default HomePage;
