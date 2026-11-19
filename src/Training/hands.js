import {HAND_SUIT_ORDER} from '../common/suits'

export const RANKS = 'AKQJT98765432'
const HCP = {A: 4, K: 3, Q: 2, J: 1}

// A hand is {S: 'AKJ', H: 'T98', D: '...', C: '...'}; parseHand/formatHand use the PBN "S.H.D.C" form.
export const parseHand = text => Object.fromEntries(text.split('.').map((cards, index) => [HAND_SUIT_ORDER[index], cards]))
export const formatHand = hand => HAND_SUIT_ORDER.map(suit => hand[suit]).join('.')

export const hcp = hand => HAND_SUIT_ORDER.reduce((sum, suit) =>
    sum + [...hand[suit]].reduce((s, card) => s + (HCP[card] ?? 0), 0), 0)

export const lengths = hand => Object.fromEntries(HAND_SUIT_ORDER.map(suit => [suit, hand[suit].length]))

// e.g. [5, 3, 3, 2]
export const shape = hand => HAND_SUIT_ORDER.map(suit => hand[suit].length).sort((a, b) => b - a)

export const isBalanced = hand => ['4333', '4432', '5332'].includes(shape(hand).join(''))

const sortCards = cards => [...cards].sort((a, b) => RANKS.indexOf(a) - RANKS.indexOf(b)).join('')

export const DECK = HAND_SUIT_ORDER.flatMap(suit => [...RANKS].map(rank => suit + rank))

export const handFromCards = cards => Object.fromEntries(HAND_SUIT_ORDER.map(suit =>
    [suit, sortCards(cards.filter(card => card[0] === suit).map(card => card[1]))]))

export const shuffle = (array, random = Math.random) => {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))
        ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
}

export const randomHand = (random = Math.random) => handFromCards(shuffle(DECK, random).slice(0, 13))

export const describeHand = hand => `${hcp(hand)} PC, układ ${HAND_SUIT_ORDER.map(suit => hand[suit].length).join('-')}`
