/*
 * The PZBS convention card (kartakonw.docx): the content is in karta-pzbs.json; null marks a field still to fill in.
 */

// rows of the leads table in the order of the form (an array: numeric object keys would be sorted first)
export const LEAD_ROWS = [['A', 'w asa'], ['K', 'w króla'], ['Q', 'w damę'], ['J', 'w waleta'], ['10', '10'], ['9', '9'],
    ['wysokaX', 'w wysoką x'], ['niskaX', 'w niską x']]

const OPENING_FIELDS = {sztuczna: 'sztuczna', minKart: 'min. kart', opis: 'opis', odpowiedzi: 'odpowiedzi',
    dalszaLicytacja: 'dalsza licytacja', poPasie: 'po pasie'}

const SECTION_LABELS = {
    'naglowek.gracze': 'Nazwiska graczy',
    'naglowek.kategoria': 'Kategoria PZBS',
    'naglowek.zawody': 'Zawody',
    konwencjeStrefySzlemowej: 'Konwencje strefy szlemowej',
    'wejscia.wObronie': 'Wejścia w obronie',
    'wejscia.wejscie1BA': 'Wejście 1BA',
    'wejscia.zPrzeskokiem': 'Wejścia z przeskokiem',
    'wejscia.kolorPrzeciwnika': 'Wejścia kolorem przeciwnika',
    'wejscia.przeciwBA.slabemu': 'Przeciw słabemu BA',
    'wejscia.przeciwBA.klasycznemu': 'Przeciw klasycznemu BA',
    'wejscia.przeciwZaporowkom': 'Przeciw zaporówkom',
    'wejscia.przeciwSztucznymSilnym': 'Przeciw sztucznym silnym otwarciom',
    'wejscia.przeciwKontrzeWywolawczej': 'Przeciw kontrze wywoławczej',
    'wisty.sygnaly.doWyjsciaPartnera': 'Sygnały do wyjścia partnera',
    'wisty.sygnaly.doWyjsciaRozgrywajacego': 'Sygnały do wyjścia rozgrywającego',
    'wisty.sygnaly.doInnegoKoloru': 'Sygnały do innego koloru',
    'kontry.wywolawcze': 'Kontry wywoławcze',
    'kontry.specjalne': 'Specjalne sztuczne kontry i rekontry',
    'streszczenie.opisOgolny': 'Opis ogólny',
    'streszczenie.specjalneOdzywki': 'Specjalne odzywki, które wymagają obrony',
    'streszczenie.forsujacyPas': 'Specjalne sekwencje z forsującym pasem',
    'streszczenie.wazneUwagi': 'Ważne uwagi',
    'streszczenie.psychologiczne': 'Odzywki psychologiczne',
}

const valueAt = (data, path) => path.split('.').reduce((value, key) => value?.[key], data)

// Fields of karta-pzbs.json that are still null, with readable labels.
export const missingFields = data => {
    const missing = []
    for (const opening of data.otwarcia) {
        const fields = Object.entries(OPENING_FIELDS).filter(([key]) => opening[key] === null).map(([, label]) => label)
        if (fields.length > 0) {
            missing.push(`Otwarcie ${opening.otwarcie}: ${fields.join(', ')}`)
        }
    }
    for (const [path, label] of Object.entries(SECTION_LABELS)) {
        if (valueAt(data, path) === null) {
            missing.push(label)
        }
    }
    const leads = LEAD_ROWS.filter(([key]) => ['kolor', 'ba'].some(column => data.wisty.wyjscia[key]?.[column] === null))
    if (leads.length > 0) {
        missing.push(`Wyjścia: ${leads.map(([, label]) => label).join(', ')}`)
    }
    return missing
}
