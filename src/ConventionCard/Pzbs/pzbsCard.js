import {parseBidding} from '../bidding'

/*
 * Data of the PZBS "minikarta konwencyjna" (one A4 page with two copies, one for each opponent): the choices from
 * karta-pzbs.json, and the defence after 1NT read from the section of bidding.txt named in obronaPo1BA.sekcja.
 */

const DEFENCE_CALLS = [['X', 'Kontra'], ['2T', '2♣'], ['2K', '2♦'], ['2C', '2♥'], ['2P', '2♠'], ['2BA', '2BA']]

export const defenceAfter1NT = (biddingText, sectionTitle) => {
    const entries = parseBidding(biddingText)
    const section = entries.find(entry => entry.type === 'section' && entry.title === sectionTitle)
    if (!section) {
        return null
    }
    const lines = entries.filter(entry => entry.type === 'bid' && entry.scope === section.id)
    return DEFENCE_CALLS.map(([call, label]) => ({
        label,
        description: lines.find(entry => entry.sequence === `1BA-${call}`)?.description ?? null,
    }))
}

const MISSING_LABELS = {
    'system.wybor': 'System (Wspólny Język / Nasz System / inny)',
    blefy: 'Blefy',
    'kontraNaOtwarcie1wKolor.przedPasem': 'Kontra na otwarcie 1 w kolor – partner przed pasem',
    'kontraNaOtwarcie1wKolor.poPasie': 'Kontra na otwarcie 1 w kolor – partner po pasie',
    wejscie1BANaWygasajacej: 'Wejście 1BA w obronie na wygasającej',
    'kontraNegatywna.po1wKolor': 'Kontra negatywna do poziomu – po otwarciu 1 w kolor',
    'kontraNegatywna.po1BA': 'Kontra negatywna do poziomu – po otwarciu 1BA',
    odwrotka: 'Odwrotka',
    po1BAktr2H: 'W sekwencji 1BA (ktr) 2♥',
    wist: 'Wist',
    zrzutki: 'Zrzutki',
}

const valueAt = (data, path) => path.split('.').reduce((value, key) => value?.[key], data)

// Fields of the card that are still empty in karta-pzbs.json.
export const missingFields = data => Object.entries(MISSING_LABELS)
    .filter(([path]) => {
        const value = valueAt(data, path)
        return value === null || value === undefined || (Array.isArray(value) && value.length === 0)
    })
    .map(([, label]) => label)
