// Players of the pair, recognised by the names in the [North]/[East]/[South]/[West] tags of a deal.
export const PLAYERS = {
    BB: {name: 'Bartek', genitive: 'Bartka', pattern: /bart|^bb$/i},
    MJ: {name: 'Marek', genitive: 'Marka', pattern: /marek|^mj$/i},
}

const SEAT_TAGS = {N: 'North', E: 'East', S: 'South', W: 'West'}

// The seat of a player in a deal, or null when the deal does not name him.
export const seatOf = (deal, player) => {
    const pattern = PLAYERS[player]?.pattern
    if (!pattern) {
        return null
    }
    for (const [seat, tag] of Object.entries(SEAT_TAGS)) {
        const name = deal.rawLines.map(line => line.match(new RegExp(`^\\[${tag} "(.*)"]`))).find(Boolean)?.[1]
        if (name && pattern.test(name.trim())) {
            return seat
        }
    }
    return null
}
