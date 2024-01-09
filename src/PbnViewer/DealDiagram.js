import './PbnViewer.css';
import Suite from "./Suite";

const DealDiagram = (props) => {

    function renderLetter(letter) {
        return <div
            className={"Letter" + (props.vulnerable.includes(letter) ? ' Vulnerable' : ' NonVulnerable') + (props.dealer === letter ? ' Dealer' : ' NonDealer')}>{letter}</div>;
    }

    return <div className="DealDiagram">
        <div className="DealNumber">{props.dealNumber}.</div>
        <div className="North Hand">
            <div><Suite cards={props.deal['N'][0]} suite={0}/></div>
            <div><Suite cards={props.deal['N'][1]} suite={1}/></div>
            <div><Suite cards={props.deal['N'][2]} suite={2}/></div>
            <div><Suite cards={props.deal['N'][3]} suite={3}/></div>
        </div>
        <div className="WestEast">
            <div className="West Hand">
                <div><Suite cards={props.deal['W'][0]} suite={0}/></div>
                <div><Suite cards={props.deal['W'][1]} suite={1}/></div>
                <div><Suite cards={props.deal['W'][2]} suite={2}/></div>
                <div><Suite cards={props.deal['W'][3]} suite={3}/></div>
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
                <div><Suite cards={props.deal['E'][0]} suite={0}/></div>
                <div><Suite cards={props.deal['E'][1]} suite={1}/></div>
                <div><Suite cards={props.deal['E'][2]} suite={2}/></div>
                <div><Suite cards={props.deal['E'][3]} suite={3}/></div>
            </div>
        </div>
        <div className="South Hand">
            <div><Suite cards={props.deal['S'][0]} suite={0}/></div>
            <div><Suite cards={props.deal['S'][1]} suite={1}/></div>
            <div><Suite cards={props.deal['S'][2]} suite={2}/></div>
            <div><Suite cards={props.deal['S'][3]} suite={3}/></div>
        </div>
    </div>
}

export default DealDiagram;
