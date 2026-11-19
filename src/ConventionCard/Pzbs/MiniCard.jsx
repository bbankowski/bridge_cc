import {Fragment} from 'react'

// Suit symbols with red hearts and diamonds.
const Text = ({children}) => String(children ?? '').split(/([♥♦])/).map((part, index) =>
    part === '♥' || part === '♦' ? <span key={index} className="MiniCard-red">{part}</span> : <Fragment key={index}>{part}</Fragment>)

const Box = ({checked, label}) => <span className="MiniCard-box">
    <span className="MiniCard-check" aria-label={checked ? 'zaznaczone' : 'puste'}>{checked ? '☒' : '☐'}</span>
    {' '}<Text>{label}</Text>
</span>

const Dots = ({value}) => value
    ? <span className="MiniCard-filled"><Text>{value}</Text></span>
    : <span className="MiniCard-dots"/>

const OPENINGS = [
    ['1D', '1♦', [['4+', '4+♦'], ['5+', '5+♦']]],
    ['1NT', '1BA', [['silne', 'silne'], ['slabe', 'słabe']]],
    ['2C', '2♣', [['precision', 'Precision'], ['acol', 'Acol']]],
    ['2D', '2♦', [['wilkosz', 'Wilkosz'], ['multi', 'Multi']]],
    ['2H', '2♥', [['6', '6♥'], ['5-5', '5♥ - 5']]],
    ['2S', '2♠', [['6', '6♠'], ['5-5', '5♠ - 5']]],
    ['2NT', '2BA', [['5-5', '5♣ - 5♦'], ['silne', 'silne']]],
]

const YesNo = ({title, value}) => <div>
    <strong>{title}</strong><br/>
    <Box checked={value === true} label="tak"/><br/>
    <Box checked={value === false} label="nie"/>
</div>

// One copy of the PZBS "minikarta konwencyjna", filled from the data of karta-pzbs.json.
const MiniCard = ({data, defence}) => {
    const has = (list, value) => (list ?? []).includes(value)
    return <div className="MiniCard">
        <div className="MiniCard-column">
            <h2 className="MiniCard-title">MINIKARTA KONWENCYJNA</h2>
            <p className="MiniCard-pair">Para: <Dots value={data.para}/></p>
            <div className="MiniCard-system">
                <strong>System:</strong>
                <div>
                    <Box checked={data.system.wybor === 'wspolny'} label="Wspólny Język"/><br/>
                    <Box checked={data.system.wybor === 'strefa'} label="Nasz System (Strefa)"/><br/>
                    <Box checked={data.system.wybor === 'inny'} label="Inny:"/> <Dots value={data.system.inny}/>
                </div>
            </div>
            <strong>Otwarcia:</strong>
            <table className="MiniCard-table">
                <thead>
                <tr><th/><th colSpan="2">Znaczenie</th><th>Uwagi</th></tr>
                </thead>
                <tbody>
                {OPENINGS.map(([key, label, options]) => <tr key={key}>
                    <td><Text>{label}</Text></td>
                    {options.map(([value, optionLabel]) => <td key={value}>
                        <Box checked={data.otwarcia[key]?.wybor === value} label={optionLabel}/>
                    </td>)}
                    <td className="MiniCard-remarks"><Text>{data.otwarcia[key]?.uwagi}</Text></td>
                </tr>)}
                <tr>
                    <td>Blefy:</td>
                    <td colSpan="3">
                        <Box checked={data.blefy === 'nigdy'} label="nigdy"/>{' '}
                        <Box checked={data.blefy === 'rzadko'} label="rzadko"/>{' '}
                        <Box checked={data.blefy === 'czesto'} label="często"/>
                    </td>
                </tr>
                </tbody>
            </table>

            <strong>Kontra na otwarcie 1 w kolor:</strong>
            <table className="MiniCard-table">
                <tbody>
                {[['przedPasem', 'Partner przed pasem'], ['poPasie', 'Partner po pasie']].map(([key, label]) => <tr key={key}>
                    <td>{label}</td>
                    <td>
                        <Box checked={data.kontraNaOtwarcie1wKolor[key] === 'wywolawcza'} label="wywoł."/>{' '}
                        <Box checked={data.kontraNaOtwarcie1wKolor[key] === 'dwukolorowa'} label="dwukolorowa"/>
                    </td>
                </tr>)}
                </tbody>
            </table>

            <strong>Obrona po 1 BA:</strong>
            <div className="MiniCard-lines">
                {(defence ?? []).map(({label, description}) => <div key={label}>
                    <Text>{label}</Text>: <Dots value={description}/>
                </div>)}
                {data.obronaPo1BA.uwagi && <div className="MiniCard-note"><Text>{data.obronaPo1BA.uwagi}</Text></div>}
            </div>
        </div>

        <div className="MiniCard-column">
            <strong>Wejście 1 BA w obronie</strong>
            <div className="MiniCard-row">
                <Box checked={data.wejscie1BA.wybor === 'naturalne'} label="naturalne"/>
                <Box checked={data.wejscie1BA.wybor === '5-4'} label="5-4"/>
                {data.wejscie1BA.uwagi && <span className="MiniCard-note"><Text>{data.wejscie1BA.uwagi}</Text></span>}
            </div>
            <strong>Wejście 1BA w obronie na wygasającej</strong>
            <div className="MiniCard-row">
                {['9-14', '12-15', '15-18'].map(range =>
                    <Box key={range} checked={data.wejscie1BANaWygasajacej === range} label={`${range} PC`}/>)}
            </div>
            <strong>Kontra negatywna do poziomu</strong>
            <div className="MiniCard-lines">
                <div>Po otwarciu 1 w kolor <Dots value={data.kontraNegatywna.po1wKolor}/></div>
                <div>Po otwarciu 1 BA <Dots value={data.kontraNegatywna.po1BA}/></div>
            </div>
            <strong>Blackwood</strong>
            <div className="MiniCard-grid2">
                <Box checked={data.blackwood.asy === '4'} label="4 asy"/>
                <Box checked={has(data.blackwood.dodatki, 'dama')} label="z damą atu"/>
                <Box checked={data.blackwood.asy === '5'} label="5 asów"/>
                <Box checked={has(data.blackwood.dodatki, 'krole')} label="z królami"/>
            </div>
            <div className="MiniCard-grid3">
                <YesNo title="Lebensohl" value={data.lebensohl}/>
                <YesNo title="Drury" value={data.drury}/>
                <YesNo title="Czwarty kolor" value={data.czwartyKolor}/>
            </div>
            <div className="MiniCard-grid2">
                <div>
                    <strong>Odwrotka</strong><br/>
                    <Box checked={data.odwrotka === '4-4-5-5'} label="4-4-5-5"/><br/>
                    <Box checked={data.odwrotka === '4-5-4-5'} label="4-5-4-5"/><br/>
                    <Box checked={data.odwrotka === 'brak'} label="brak"/>
                </div>
                <div>
                    <strong>W sekwencji</strong><br/>
                    1 BA (ktr) 2<span className="MiniCard-red">♥</span><br/>
                    <Box checked={data.po1BAktr2H === 'naturalne'} label="naturalne"/><br/>
                    <Box checked={data.po1BAktr2H === 'transfer'} label="transfer"/>
                </div>
            </div>
            <div className="MiniCard-grid2">
                <div>
                    <strong>Wist</strong><br/>
                    {[['odmienny', 'odmienny'], ['naturalny', 'naturalny'], ['odwrotny', 'odwrotny'], ['kombajn', 'kombajn'], ['jakosc', 'jakość']]
                        .map(([value, label]) => <Fragment key={value}><Box checked={data.wist === value} label={label}/><br/></Fragment>)}
                </div>
                <div>
                    <strong>Zrzutki</strong><br/>
                    {[['naturalne', 'naturalne'], ['odwrotne', 'odwrotne'], ['ilosciowe', 'ilościowe'], ['jakosciowe', 'jakościowe'],
                        ['lavinthal', 'Lavinthal'], ['potwierdzenie', 'Potw. wistu']]
                        .map(([value, label]) => <Fragment key={value}><Box checked={has(data.zrzutki, value)} label={label}/><br/></Fragment>)}
                </div>
            </div>
        </div>
    </div>
}

export default MiniCard
