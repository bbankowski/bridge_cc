/*
 * Our result of a deal, read from its comment: "WYNIK: -7" (IMPs) or "WYNIK: 67.39%" (matchpoints).
 * Returns {type: 'imp' | 'pct', value} or null when the comment has no result.
 */
export const dealResult = deal => {
    // "WYNIL" is a typo in one of the files
    const match = /WYNI[KL]\s*[:=]\s*([+-]?\d+(?:[.,]\d+)?)\s*(%)?/.exec(deal.commentText ?? '')
    if (!match) {
        return null
    }
    const value = Number(match[1].replace(',', '.'))
    return match[2] ? {type: 'pct', value} : {type: 'imp', value}
}

export const isLoss = result => result !== null && (result.type === 'pct' ? result.value < 50 : result.value < 0)
export const isGain = result => result !== null && (result.type === 'pct' ? result.value > 50 : result.value > 0)

export const formatResult = result => result === null ? null
    : result.type === 'pct' ? `${result.value}%` : `${result.value > 0 ? '+' : ''}${result.value} IMP`

export const FILTERS = {
    komentarz: {label: 'Tylko z komentarzem', test: deal => (deal.commentText ?? '').trim() !== ''},
    straty: {label: 'Tylko nasze straty', test: deal => isLoss(dealResult(deal))},
}

// "komentarz,straty" -> ['komentarz', 'straty'] (unknown names are ignored)
export const parseFilters = value => (value ?? '').split(',').filter(name => FILTERS[name])

export const visibleDeals = (deals, filters) => deals
    .map((deal, index) => index)
    .filter(index => filters.every(name => FILTERS[name].test(deals[index])))
