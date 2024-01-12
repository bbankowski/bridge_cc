import './PbnViewer.css';
import Bid from "./Bid";
import Suite from "./Suite";
import React from "react";

const Minimax = (props) => {
    let minimaxContract = props.minimax.substring(0, 2).replace('N', 'NT')
    let minimaxDeclarer = props.minimax.charAt(2)
    let minimaxScore = props.minimax.substring(3)

    let results = props.optimumResults

    const order = ['NT', 'S', 'H', 'D', 'C']

    function renderRow(player) {
        return <tr>
            <td>{player}</td>
            {order.map(suite => {
                return <td>{results[player][suite]}</td>
            })}
        </tr>
    }

    function renderHeader() {
        return <thead>
        <tr>
            <th></th>
            {order.map(suite => {
                return <th>{suite === 'NT' ? 'NT' : <Suite suite={suite}/>}</th>
            })}
        </tr>
        </thead>
    }

    function renderTable(player1, player2) {
        return <table className="table">
            {renderHeader()}
            <tbody>
            {renderRow(player1)}
            {renderRow(player2)}
            </tbody>
        </table>
    }

    return <div className="Minimax">
        {renderTable('N', 'S')}
        {renderTable('W', 'E')}
        <div className="MinimaxValue">Minimax: <Bid bid={minimaxContract}/> {minimaxDeclarer} {minimaxScore}</div>
    </div>
}

export default Minimax;
