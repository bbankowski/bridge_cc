import {hcp, isBalanced, lengths, shape} from './hands'

/*
 * Openings of the BB–MJ system (bidding.txt, chapter "Nasze otwarcia"):
 *  1♣  12-14 balanced, or 15+ with 5+ clubs, or any 18+, or 12+ 4-4-1-4 (singleton diamond)
 *  1♦  12-17, 5+ diamonds, or 4441 with four diamonds; 12-14 also 4 diamonds + 5 clubs
 *  1♥  12-17, 5+ hearts (15-17 with 5332 always 1NT);  1♠ 12-17, 5+ spades
 *  1NT 15-17 balanced, a 5-card major or a 6-card minor possible; 5422 possible too
 *  2♣  11-14, 6+ clubs or 5+ clubs and a 4-card major
 *  2♦  mini multi: 5-10, 6+ in a major
 *  2♥  5-11, 5+ hearts and 5+ another;  2♠ 5-11, 5+ spades and 5+ minor;  2NT 5-11, 5+ clubs and 5+ diamonds
 *  3x  vulnerable: 7+ suit with two of the top three honours; not vulnerable: the longest suit, any quality
 *  3NT gambling: AKQxxxx in a minor, no side ace or king
 * evaluateOpening returns the acceptable calls with scores (100 = system call) and reasons. Some cases are judgement
 * calls (e.g. 15-17 with a 5-card major); they get several options.
 */

const SUITS_BY_RANK = ['S', 'H', 'D', 'C']
const CALL = {S: 'S', H: 'H', D: 'D', C: 'C'}

const add = (options, call, score, comment) => {
    const existing = options.find(option => option.call === call)
    if (!existing) {
        options.push({call, score, comment})
    } else if (existing.score < score) {
        Object.assign(existing, {score, comment})
    }
}

// The suit to open at the one level with a long suit: the longest, with 5-5 the higher ranking.
const longestSuit = (len, suits = SUITS_BY_RANK) => suits.reduce((best, suit) => (len[suit] > len[best] ? suit : best), suits[0])

const isGambling = hand => ['D', 'C'].some(suit => hand[suit].length === 7 && hand[suit].startsWith('AKQ')
    && SUITS_BY_RANK.filter(other => other !== suit).every(other => !/[AK]/.test(hand[other])))

const topHonours = cards => [...cards.slice(0, 3)].filter(card => 'AKQ'.includes(card)).length

export const evaluateOpening = (hand, {vulnerable = false} = {}) => {
    const points = hcp(hand)
    const len = lengths(hand)
    const balanced = isBalanced(hand)
    const sorted = shape(hand)
    const options = []

    if (isGambling(hand)) {
        add(options, '3NT', 100, 'gambling: AKDxxxx w młodszym, bez bocznego dojścia')
    }

    if (points >= 18) {
        add(options, '1C', 100, '18+ PC, skład dowolny: 1♣')
    } else if (points >= 12) {
        const longest = longestSuit(len)
        const fiveCardMajor = ['S', 'H'].find(suit => len[suit] >= 5)
        if (points >= 15 && (balanced || (sorted.join('') === '6322' && (len.D === 6 || len.C === 6)))) {
            add(options, '1NT', 100, '15-17 PC, skład równy (możliwa starsza piątka lub młodsza szóstka): 1BA')
            if (len.H === 5) {
                add(options, '1H', 20, 'z 15-17 PC i składem 5332 z piątką kier otwieramy zawsze 1BA')
            }
            if (len.S === 5) {
                add(options, '1S', 60, 'możliwe, ale z 15-17 i składem równym system preferuje 1BA')
            }
            if (len.C >= 5) {
                add(options, '1C', 70, '15+ z piątką trefli to też 1♣, ale skład równy 15-17 to przede wszystkim 1BA')
            }
            if (len.D >= 5) {
                add(options, '1D', 60, 'możliwe 1♦, ale skład równy 15-17 to przede wszystkim 1BA')
            }
        } else if (sorted.join('') === '4441' && len.D === 1) {
            add(options, '1C', 100, '12+ 4-4-1-4 (singiel karo): 1♣')
            add(options, '1D', 20, '1♦ obiecuje cztery kara; 4-4-1-4 system otwiera 1♣')
        } else if (sorted.join('') === '4441') {
            add(options, '1D', 100, '4441 z czterema karami, 12-17 PC: 1♦')
        } else if (fiveCardMajor && (len[fiveCardMajor] >= len.D && len[fiveCardMajor] >= len.C)) {
            const major = len.S >= 5 && len.S >= len.H ? 'S' : 'H'
            add(options, `1${CALL[major]}`, 100, `12-17 PC, 5+ ${major === 'S' ? 'pików' : 'kierów'}`)
        } else if (len.D === 4 && len.C === 5 && points >= 15 && len.S < 5 && len.H < 5) {
            add(options, '1C', 100, '15+ PC z piątką trefli: 1♣ (4 kara i 5 trefli otwieramy 1♦ tylko z 12-14)')
            add(options, '1D', 40, '4 kara i 5 trefli to 1♦ tylko z 12-14 PC')
        } else if ((longest === 'D' && len.D >= 5) || (len.D === 4 && len.C === 5)) {
            add(options, '1D', 100, len.D >= 5 ? '12-17 PC, 5+ kar' : '12-17 PC, 4 kara i 5 trefli')
            if (balanced && points <= 14) {
                add(options, '1C', 50, '12-14 w składzie równym to 1♣, ale z piątką kar system daje 1♦')
            }
            if (len.D === 4 && points <= 14 && (len.S === 4 || len.H === 4)) {
                add(options, '2C', 50, '5 trefli i starsza czwórka to też 2♣, ale z czwórką kar system daje 1♦')
            }
        } else if (longest === 'C' && len.C >= 5) {
            if (points >= 15) {
                add(options, '1C', 100, '15+ PC z piątką trefli: 1♣')
            } else if (len.C >= 6 || ['S', 'H'].some(suit => len[suit] === 4)) {
                add(options, '2C', 100, '11-14 PC, 6+ trefli lub 5+ trefli i 4 w starszym: 2♣')
                if (balanced) {
                    add(options, '1C', 40, 'skład równy 12-14 to 1♣, ale z treflami i starszą czwórką system daje 2♣')
                }
            } else if (balanced) {
                add(options, '1C', 100, '12-14 PC, skład równy: 1♣')
            } else {
                add(options, '1C', 80, '12-14 z piątką trefli bez starszej czwórki')
            }
        } else if (balanced && points <= 14) {
            add(options, '1C', 100, '12-14 PC, skład równy: 1♣')
        } else {
            // e.g. 15-17 with 4-4-4-1 handled above; remaining 15-17 with 4 clubs and 5 diamonds etc.
            add(options, `1${CALL[longest]}`, 80, 'najdłuższy kolor')
        }
    } else if (points === 11 && (len.C >= 6 || (len.C >= 5 && ['S', 'H'].some(suit => len[suit] === 4)))) {
        add(options, '2C', 100, '11-14 PC, 6+ trefli lub 5+ trefli i 4 w starszym: 2♣')
    }

    if (points >= 15 && points <= 17 && sorted.join('') === '5422') {
        add(options, '1NT', 80, '15-17 PC: z 5422 możliwe też 1BA')
    }

    if (points >= 5 && points <= 11) {
        if (len.H >= 5 && (len.S >= 5 || len.D >= 5 || len.C >= 5)) {
            add(options, '2H', 100, '5-11 PC, 5+ kierów i 5+ w innym kolorze: 2♥')
        } else if (len.S >= 5 && (len.D >= 5 || len.C >= 5)) {
            add(options, '2S', 100, '5-11 PC, 5+ pików i 5+ w młodszym: 2♠')
        } else if (len.C >= 5 && len.D >= 5) {
            add(options, '2NT', 100, '5-11 PC, 5+ trefli i 5+ kar: 2BA')
        }
    }

    if (points >= 5 && points <= 10 && options.length === 0) {
        const major = ['S', 'H'].find(suit => len[suit] >= 6)
        if (major && len[major] === 6) {
            add(options, '2D', 100, `mini-multi: 5-10 PC, 6+ ${major === 'S' ? 'pików' : 'kierów'}: 2♦`)
        }
    }

    if (points <= 10 && options.length === 0) {
        const suit = longestSuit(len)
        if (len[suit] >= 7 && (!vulnerable || topHonours(hand[suit]) >= 2)) {
            add(options, `3${CALL[suit]}`, 100, vulnerable
                ? 'po partii: kolor 7+ z dwiema starszymi figurami'
                : 'przed partią: blok w najdłuższym kolorze, siła dowolna')
            if (['S', 'H'].includes(suit) && points >= 5) {
                add(options, '2D', 50, 'mini-multi obiecuje szóstkę; z siódemką system daje blok na trzecim poziomie')
            }
        }
    }

    if (options.length === 0) {
        add(options, 'Pass', 100, 'ręka bez otwarcia w systemie')
    }
    options.sort((a, b) => b.score - a.score)
    return {best: options[0].call, options}
}
