import './PbnViewer.css';
import Suite from "./Suite";

const DealDiagram = (props) => {
    const suites = [0, 1, 2, 3]

    function renderLetter(letter) {
        let vulnerableClassName = props.vulnerable.includes(letter) ? ' Vulnerable' : ' NonVulnerable';
        let dealerClassName = props.dealer === letter ? ' Dealer' : ' NonDealer';
        let className = "Letter" + vulnerableClassName + dealerClassName;

        return <div className={className}>{letter}</div>;
    }

    function renderSuites(player) {
        return <>
            {suites.map(suite => {
                return <div><Suite cards={props.deal[player][suite]} suite={suite}/></div>
            })}
        </>;
    }

    return <div className="DealDiagram">
        <div className="DealNumber">{props.dealNumber}.</div>
        <div className="North Hand">
            {renderSuites('N')}
        </div>
        <div className="WestEast">
            <div className="West Hand">
                {renderSuites('W')}
            </div>
            <div className="Middle">
                {renderLetter('N')}
                <div className="WestEast">
                    {renderLetter('W')}
                    {renderLetter('E')}
                </div>
                {renderLetter('S')}
            </div>
            <div className="East Hand">
                {renderSuites('E')}
            </div>
        </div>
        <div className="South Hand">
            {renderSuites('S')}
        </div>
    </div>
}

export default DealDiagram;
