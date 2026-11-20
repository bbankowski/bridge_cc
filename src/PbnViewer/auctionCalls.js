const SEATS = ['N', 'E', 'S', 'W']

// The calls of an auction (rows of N/E/S/W) in order, with their seat and position: [{call, seat, row, column}].
export const auctionCalls = auction => auction.flatMap((row, rowIndex) => row
    .map((call, column) => call && {call, seat: SEATS[column], row: rowIndex, column})
    .filter(Boolean))
