import './PbnViewer.css';
import Club from "../club.svg";
import Heart from "../heart.svg";
import Spade from "../spade.svg";
import Diamond from "../diamond.svg";

const Suite = (props) => {
    function getColor(suite) {
        switch (suite) {
            case 'C':
            case 3:
                return Club
            case 'D':
            case 2:
                return Diamond
            case 'S':
            case 0:
                return Spade
            case 'H':
            case 1:
                return Heart
            default:
                return null
        }
    }

    return <span className="Suite">
        <img className="App-card-img" src={getColor(props.suite)} alt=""/>
        {props.cards}
    </span>
}

export default Suite;
