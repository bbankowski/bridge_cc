import reactStringReplace from 'react-string-replace'
import Suit from '../common/Suit'

// Replaces suit escapes ("\S", "\H", "\D", "\C") with suit icons. Literal "\n" sequences are dropped.
export const formatText = text => reactStringReplace(
    (text || '').replaceAll('\\n', ''),
    /\\([SHDC])/g,
    (suit, index) => <Suit key={index} suit={suit}/>,
)
