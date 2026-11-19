import Club from '../assets/club.svg'
import Diamond from '../assets/diamond.svg'
import Heart from '../assets/heart.svg'
import Spade from '../assets/spade.svg'

// Suits are identified by their PBN (English) letter.
export const SUIT_ICONS = {S: Spade, H: Heart, D: Diamond, C: Club}

// Order of the suits in a PBN hand: "spades.hearts.diamonds.clubs".
export const HAND_SUIT_ORDER = ['S', 'H', 'D', 'C']

// The convention card uses Polish suit letters: Trefl, Karo, Kier (C), Pik.
const POLISH_TO_PBN_SUIT = {T: 'C', K: 'D', C: 'H', P: 'S'}

export const polishBidToPbn = bid => {
    const match = /^([1-7])([TKCP])$/.exec(bid)
    return match ? match[1] + POLISH_TO_PBN_SUIT[match[2]] : bid
}
