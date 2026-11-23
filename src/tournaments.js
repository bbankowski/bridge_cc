/*
 * The tournaments of the PBN viewer: a file in public/ and its name on the home page. A team event may also have
 * a summary of its matches shown above the deals: our team, and for each match the opponents, the score (IMPs, VPs)
 * and who sat where in each segment. `deals` are the first and the last deal of a segment as positions in the file
 * (1-based), `ours` says which pair of a table is our team.
 */
export const TOURNAMENTS = [
    {file: '4kroli.pbn', name: '2024.01.07 Czterech Króli'},
    {file: '2024.01.01-TreningCKiS.pbn', name: '2024.01.11 Trening CKiS Skawina BBO'},
    {file: '2liga_3zjazd.pbn', name: '2024.01.20-21 Trzeci zjazd II ligi'},
    {file: '2024.02.28-Mindlab.pbn', name: '2024.02.28 Mindlab'},
    {file: '2024.03.27-Mindlab.pbn', name: '2024.03.27 Mindlab'},
    {file: '2024.04.03-Mindlab.pbn', name: '2024.04.03 Mindlab'},
    {file: '2024.04.06-RewersJoker.pbn', name: '2024.04.06 II liga play-off vs Rewers Joker (2 i 3 składka)'},
    {file: '2024.06.23-Slawa_GPP.pbn', name: '2024.06.23 GPPP w Sławie'},
    {file: '3liga_2025-2026_3zjazd.pbn', name: '2026.01.31-02.01 Trzeci zjazd III ligi'},
    {
        file: '3liga_2026-2027_runda5-6.pbn', name: '2026.11.21-22 Pierwszy zjazd III ligi',
        team: 'CKiS Skawina',
        matches: [
            {
                title: 'Runda 5', opponent: 'CKiS II Skawina', imps: [53, 33], vp: [14.58, 5.42],
                segments: [
                    {
                        deals: [1, 10],
                        ourTable: {room: 'otwarty', ns: ['Tomasz Lasota', 'Mikołaj Chmielewski'], ew: ['Marek Jarosz', 'Bartosz Bańkowski'], ours: 'ew'},
                        otherTable: {room: 'zamknięty', ns: ['Milena Klimiuk', 'Martyna Pucyk'], ew: ['Kacper Kisielewski', 'Antoni Wójtowicz'], ours: 'ns'},
                    },
                    {
                        deals: [11, 20],
                        ourTable: {room: 'otwarty', ns: ['Tomasz Lasota', 'Mikołaj Chmielewski'], ew: ['Bartosz Bańkowski', 'Marek Jarosz'], ours: 'ew'},
                        otherTable: {room: 'zamknięty', ns: ['Milena Klimiuk', 'Martyna Pucyk'], ew: ['Adam Stachura', 'Antonina Chmielewska'], ours: 'ns'},
                    },
                ],
            },
            {
                title: 'Runda 6', opponent: 'CKiS IV Skawina', imps: [96, 4], vp: [20, 0],
                segments: [
                    {
                        deals: [21, 40],
                        ourTable: {room: 'zamknięty', ns: ['Bohdan Shulha', 'Krzysztof Ziętarski'], ew: ['Marek Jarosz', 'Bartosz Bańkowski'], ours: 'ew'},
                        otherTable: {room: 'otwarty', ns: ['Jakub Michalski', 'Marcel Prokopowicz'], ew: ['Marcel Miłoś', 'Franciszek Rządzik'], ours: 'ns'},
                    },
                ],
            },
        ],
    },
]

export const tournamentOf = file => TOURNAMENTS.find(tournament => tournament.file === file)
