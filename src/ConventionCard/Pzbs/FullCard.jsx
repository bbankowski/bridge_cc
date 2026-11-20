import {Fragment} from 'react'
import {LEAD_ROWS} from './pzbsCard'

// Text with red ♥ and ♦.
const Text = ({children}) => String(children ?? '').split(/([♥♦])/).map((part, index) =>
    part === '♥' || part === '♦' ? <span key={index} className="PzbsCard-red">{part}</span> : <Fragment key={index}>{part}</Fragment>)

const Field = ({title, children, className = ''}) => <section className={`PzbsCard-field ${className}`}>
    <h3 className="PzbsCard-heading">{title}</h3>
    <div className="PzbsCard-content"><Text>{children}</Text></div>
</section>

const LONG_ROWS = 11 // 1♣ … 3♣ have all columns; 3♦ … 4♦ leave the right side for the slam conventions

// Inside page: the openings table (folded card, pages 2–3).
export const OpeningsPage = ({data}) => {
    const short = data.otwarcia.slice(LONG_ROWS)
    return <div className="PzbsCard-page PzbsCard-inside">
        <table className="PzbsCard-openings">
            <colgroup>
                <col className="col-opening"/><col className="col-flag"/><col className="col-flag"/>
                <col className="col-description"/><col className="col-responses"/><col className="col-rebids"/><col className="col-pass"/>
            </colgroup>
            <thead>
            <tr>
                <th className="PzbsCard-vertical"><span>OTWARCIE</span></th>
                <th className="PzbsCard-vertical"><span>SZTUCZNA</span></th>
                <th className="PzbsCard-vertical"><span>MIN. KART</span></th>
                <th>OPIS</th>
                <th>ODPOWIEDZI</th>
                <th>DALSZA LICYTACJA</th>
                <th>LICYTACJA PO UPRZEDNIM PASIE</th>
            </tr>
            </thead>
            <tbody>
            {data.otwarcia.slice(0, LONG_ROWS).map(opening => <tr key={opening.otwarcie}>
                <td className="PzbsCard-openingCell"><Text>{opening.otwarcie}</Text></td>
                <td className="PzbsCard-center">{opening.sztuczna === null ? '' : opening.sztuczna ? 'X' : ''}</td>
                <td className="PzbsCard-center">{opening.minKart}</td>
                <td><Text>{opening.opis}</Text></td>
                <td><Text>{opening.odpowiedzi}</Text></td>
                <td><Text>{opening.dalszaLicytacja}</Text></td>
                <td><Text>{opening.poPasie}</Text></td>
            </tr>)}
            {short.map((opening, index) => <tr key={opening.otwarcie}>
                <td className="PzbsCard-openingCell"><Text>{opening.otwarcie}</Text></td>
                <td className="PzbsCard-center">{opening.sztuczna === null ? '' : opening.sztuczna ? 'X' : ''}</td>
                <td className="PzbsCard-center">{opening.minKart}</td>
                <td><Text>{opening.opis}</Text></td>
                <td><Text>{opening.odpowiedzi}</Text></td>
                {index === 0 && <td colSpan="2" rowSpan={short.length} className="PzbsCard-slam">
                    <h3 className="PzbsCard-heading">KONWENCJE STREFY SZLEMOWEJ</h3>
                    <Text>{data.konwencjeStrefySzlemowej}</Text>
                </td>}
            </tr>)}
            </tbody>
        </table>
    </div>
}

// Outside page: competitive bidding, leads and signals, doubles, and the cover with the summary (pages 4 and 1).
export const OutsidePage = ({data}) => {
    const {wejscia, wisty, kontry, streszczenie, naglowek} = data
    return <div className="PzbsCard-page PzbsCard-outside">
        <div className="PzbsCard-column">
            <h2 className="PzbsCard-title">WEJŚCIA W LICYTACJI DWUSTRONNEJ</h2>
            <Field title="WEJŚCIA W OBRONIE">{wejscia.wObronie}</Field>
            <Field title="WEJŚCIE 1BA">{wejscia.wejscie1BA}</Field>
            <Field title="WEJŚCIA Z PRZESKOKIEM">{wejscia.zPrzeskokiem}</Field>
            <Field title="WEJŚCIA KOLOREM PRZECIWNIKA">{wejscia.kolorPrzeciwnika}</Field>
            <section className="PzbsCard-field">
                <h3 className="PzbsCard-heading">PRZECIW BEZ ATU</h3>
                <div className="PzbsCard-twoColumns">
                    <div><strong>słabemu</strong><br/><Text>{wejscia.przeciwBA.slabemu}</Text></div>
                    <div><strong>klasycznemu</strong><br/><Text>{wejscia.przeciwBA.klasycznemu}</Text></div>
                </div>
            </section>
            <Field title="PRZECIW ZAPORÓWKOM">{wejscia.przeciwZaporowkom}</Field>
            <Field title="PRZECIW SZTUCZNYM SILNYM OTWARCIOM">{wejscia.przeciwSztucznymSilnym}</Field>
            <Field title="PRZECIW KONTRZE WYWOŁAWCZEJ">{wejscia.przeciwKontrzeWywolawczej}</Field>
        </div>

        <div className="PzbsCard-column">
            <h2 className="PzbsCard-title">WISTY I SYGNAŁY OBROŃCÓW</h2>
            <section className="PzbsCard-field">
                <h3 className="PzbsCard-heading">WYJŚCIA</h3>
                <table className="PzbsCard-leads">
                    <thead><tr><th>wyjście</th><th>przeciw grze w kolor</th><th>przeciw grze w BA</th></tr></thead>
                    <tbody>
                    {LEAD_ROWS.map(([key, label]) => <tr key={key}>
                        <td>{label}</td>
                        <td><Text>{wisty.wyjscia[key]?.kolor}</Text></td>
                        <td><Text>{wisty.wyjscia[key]?.ba}</Text></td>
                    </tr>)}
                    </tbody>
                </table>
                {wisty.uwagiDoWyjsc && <p className="PzbsCard-note"><Text>{wisty.uwagiDoWyjsc}</Text></p>}
            </section>
            <section className="PzbsCard-field">
                <h3 className="PzbsCard-heading">SYGNAŁY UPORZĄDKOWANE POD WZGLĘDEM WAŻNOŚCI</h3>
                <div className="PzbsCard-content">
                    <p><em>do wyjścia partnera:</em> <Text>{wisty.sygnaly.doWyjsciaPartnera}</Text></p>
                    <p><em>do wyjścia rozgr.:</em> <Text>{wisty.sygnaly.doWyjsciaRozgrywajacego}</Text></p>
                    <p><em>do innego koloru:</em> <Text>{wisty.sygnaly.doInnegoKoloru}</Text></p>
                </div>
            </section>
            <h2 className="PzbsCard-title">KONTRY</h2>
            <Field title="KONTRY WYWOŁAWCZE">{kontry.wywolawcze}</Field>
            <Field title="SPECJALNE SZTUCZNE KONTRY I REKONTRY">{kontry.specjalne}</Field>
        </div>

        <div className="PzbsCard-column">
            <div className="PzbsCard-cover">
                <h2 className="PzbsCard-coverTitle">Karta Konwencyjna</h2>
                <p className="PzbsCard-suits">♠ <span className="PzbsCard-red">♥</span> <span className="PzbsCard-red">♦</span> ♣</p>
                <p>Kategoria PZBS: <Text>{naglowek.kategoria}</Text></p>
                <p>Zawody: <Text>{naglowek.zawody}</Text></p>
                <p>NAZWISKA GRACZY: <strong><Text>{naglowek.gracze}</Text></strong></p>
            </div>
            <h2 className="PzbsCard-title">STRESZCZENIE SYSTEMU</h2>
            <Field title="OPIS OGÓLNY">{streszczenie.opisOgolny}</Field>
            <Field title="SPECJALNE ODZYWKI KTÓRE WYMAGAJĄ OBRONY">{streszczenie.specjalneOdzywki}</Field>
            <Field title="SPECJALNE SEKWENCJE Z FORSUJĄCYM PASEM">{streszczenie.forsujacyPas}</Field>
            <Field title="WAŻNE UWAGI, KTÓRE NIE PASUJĄ GDZIE INDZIEJ">{streszczenie.wazneUwagi}</Field>
            <Field title="ODZYWKI PSYCHOLOGICZNE">{streszczenie.psychologiczne}</Field>
        </div>
    </div>
}
