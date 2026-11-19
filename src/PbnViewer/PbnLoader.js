import './PbnViewer.css';
import React from "react";
import reactStringReplace from 'react-string-replace'
import Suite from "./Suite";

export const replaceBidsInText = comment => {
    comment = comment.replaceAll('\\n', '')
    let foundBids = comment.matchAll(/(\\[SCDH])/g)
    if (foundBids) {
        for (const foundBid of foundBids) {
            let bid = foundBid[0].replace('\\', '')
            comment = reactStringReplace(comment, foundBid[0], (foundBid, i) => (
                <Suite suite={bid} cards=''/>
            ));
        }
    }
    return comment;
}

function chunkMaxLength(array, chunkSize, maxLength) {
    return Array.from({length: maxLength}, () => array.splice(0, chunkSize));
}

function updateDeal(deal) {
    const players = {
        'N': ['N', 'E', 'S', 'W'],
        'E': ['E', 'S', 'W', 'N'],
        'S': ['S', 'W', 'N', 'E'],
        'W': ['W', 'N', 'E', 'S'],
    }

    let hands = deal['Deal'].split(' ')
    let firstHand = hands[0].charAt(0)
    hands[0] = hands[0].substring(2)
    deal['hands'] = []
    for (let i = 0; i < 4; i++) {
        deal['hands'][players[firstHand][i]] = hands[i].split('.')
    }

    let bids = []
    if (deal['Dealer'] === 'E') {
        bids.push([])
    } else if (deal['Dealer'] === 'S') {
        bids.push([])
        bids.push([])
    } else if (deal['Dealer'] === 'W') {
        bids.push([])
        bids.push([])
        bids.push([])
    }
    let previousBid = null
    if (deal && deal['auction'] && deal['auction'].length > 0) {
        for (let bid of deal['auction'].trim().split(' ')) {
            bid = bid.trim()
            if (bid === 'Pass') {
                bid = 'pas'
            } else if (bid === 'AP') {
                break
            } else if (bid.startsWith('$')) {
                // PBN NAG annotation (e.g. "$6"), not a call
                continue
            } else if (bid.startsWith('=')) {
                previousBid[1] = bid.replaceAll('=', '')
                continue
            }
            previousBid = [bid]
            bids.push(previousBid)
        }
    }
    bids.push(['pas'])
    bids.push(['pas'])
    bids.push(['pas'])
    while (bids.length % 4 !== 0) {
        bids.push([])
    }
    deal['chunkedAuction'] = chunkMaxLength(bids, 4, bids.length / 4)

    if (deal['Vulnerable'] === 'Love' || deal['Vulnerable'] === 'None' || deal['Vulnerable'] === '-') {
        deal['Vulnerable'] = []
    }
    if (deal['Vulnerable'] === 'Both' || deal['Vulnerable'] === 'All') {
        deal['Vulnerable'] = ['N', 'S', 'E', 'W']
    }
    if (deal['Vulnerable'] === 'NS') {
        deal['Vulnerable'] = ['N', 'S']
    }
    if (deal['Vulnerable'] === 'EW') {
        deal['Vulnerable'] = ['E', 'W']
    }

    deal['commentText'] = deal['comment'] || ''
    deal['comment'] = replaceBidsInText(deal['comment'] || '')

    return deal
}

function getInitialOptimumResultTable() {
    return {'N': {}, 'S': {}, 'E': {}, 'W': {}};
}

export const loadPbn = (filename) => {
    return Promise.any([fetch(filename).then((r) => {
        return r.text().then(pbn => {
            let loadedDeals = []
            let headers = []
            const lines = pbn.split(/\r?\n/)

            let deal = []
            deal['Vulnerable'] = '-'
            deal['notes'] = []
            // original lines of the current deal (without the comment), used to re-export the PBN
            let rawLines = []
            let commentIndex = undefined
            const finishDeal = () => {
                deal['rawLines'] = rawLines
                deal['commentIndex'] = commentIndex
                loadedDeals.push(updateDeal(deal))
            }
            let commentStarted = false
            let comment = ''
            let auctionStarted = false
            let auction = ''
            let optimumResultTableStarted = false
            let optimumResultTable = getInitialOptimumResultTable()
            for (const line of lines) {
                if (line.startsWith('%')) {
                    headers.push(line)
                    continue
                }

                if (line.startsWith('[') && optimumResultTableStarted) {
                    optimumResultTableStarted = false
                    deal['optimumResultTable'] = optimumResultTable
                    optimumResultTable = getInitialOptimumResultTable()
                }

                if (line.startsWith('[Event') && Object.keys(deal).length > 2) {
                    finishDeal()
                    deal = []
                    deal['Vulnerable'] = '-'
                    deal['notes'] = []
                    rawLines = []
                    commentIndex = undefined
                }
                if (commentStarted || (line.startsWith('{') && !auctionStarted)) {
                    if (!commentStarted) {
                        commentIndex = rawLines.length
                    }
                } else {
                    rawLines.push(line)
                }
                if (auctionStarted) {
                    if (line.startsWith('[')) {
                        deal['auction'] = auction
                        auctionStarted = false
                        auction = ''
                    } else {
                        auction += " " + line
                        continue
                    }
                }
                if (optimumResultTableStarted) {
                    let resultParts = line.replaceAll('  ', ' ').split(' ')
                    if (resultParts.length === 3) {
                        optimumResultTable[resultParts[0]][resultParts[1]] = resultParts[2]
                        continue
                    } else {
                        optimumResultTableStarted = false
                        deal['optimumResultTable'] = optimumResultTable
                        optimumResultTable = getInitialOptimumResultTable()
                    }
                }
                if (commentStarted) {
                    comment += "\n" + line
                    if (line.endsWith('}')) {
                        comment = comment.slice(0, -1)
                        commentStarted = false
                        deal['comment'] = comment
                        comment = ''
                    }
                    continue
                }

                if (line.startsWith('[')) {
                    let found = line.match(/\[([A-Za-z]+) "(.*)"]/)
                    if (found && found.length === 3) {
                        let tag = found[1]
                        let param = found[2]
                        deal[tag] = param
                        if (tag === 'Auction') {
                            auctionStarted = true
                        } else if (tag === 'Note') {
                            deal['notes'].push(replaceBidsInText(param))
                        } else if (tag === 'OptimumResultTable') {
                            optimumResultTableStarted = true
                        }
                    }
                } else if (line.startsWith('{')) {
                    if (line.endsWith('}')) {
                        deal['comment'] = line.slice(1, -1)
                    } else {
                        commentStarted = true
                        comment = line.substring(1)
                    }
                }
            }

            if (optimumResultTableStarted) {
                deal['optimumResultTable'] = optimumResultTable
            }

            if (Object.keys(deal).length > 2) {
                finishDeal()
            }

            return [headers, loadedDeals]
        })
    })])
}

const dealToPbnLines = deal => {
    const lines = [...(deal['rawLines'] || [])]
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.pop()
    }
    if (deal['commentText']) {
        let index = deal['commentIndex']
        if (index === undefined) {
            const resultIndex = lines.findIndex(line => line.startsWith('[Result '))
            index = resultIndex >= 0 ? resultIndex + 1 : lines.length
        }
        lines.splice(index, 0, `{${deal['commentText']}}`)
    }
    return lines
}

export const serializePbn = (headers, deals) => {
    return [...headers, ...deals.flatMap(deal => [...dealToPbnLines(deal), ''])].join('\n')
}
