import './PbnViewer.css';
import Suite from "./Suite";

const Hand = (props) => {

    return <span>
        {props.hand.map((cards, suite) => <Suite cards={cards} suite={suite}/>)}
    </span>
}

export default Hand;
