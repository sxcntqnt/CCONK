// Matatu configurations with validation
export const matatuConfigs = {
    14: {
        totalSeats: 14,
        title: '14-Seater Matatu',
        layout: [
            [[1, 2]], // Row 1: 2 seats (unchanged)
            [[3, 4, 5]], // Row 2: 3 seats
            [[6], [7, 8]], // Row 3: 1 seat, aisle, 2 seats
            [[9], [10, 11]], // Row 4: 1 seat, aisle, 2 seats
            [[12, 13, 14]], // Row 5: 3 seats
        ],
    },
    26: {
        totalSeats: 26,
        title: '26-Seater Matatu',
        layout: [
            [[1, 2]], // Row 1: 2 seats
            [
                [3, 4],
                [5, 6],
            ], // Row 2: 2 left, aisle, 2 right
            [
                [7, 8],
                [9, 10],
            ], // Row 3
            [
                [11, 12],
                [13, 14],
            ], // Row 4
            [
                [15, 16],
                [17, 18],
            ], // Row 5
            [
                [19, 20],
                [21, 22],
            ], // Row 6
            [
                [23, 24],
                [25, 26],
            ], // Row 7: 1 left, aisle, 3 right
        ],
    },
    33: {
        totalSeats: 33,
        title: '33-Seater Matatu',
        layout: [
            [[1, 2]], // Row 1: 2 seats
            [
                [3, 4],
                [5, 6],
            ], // Row 2: 2 left, aisle, 2 right
            [
                [7, 8],
                [9, 10],
            ], // Row 3
            [
                [11, 12],
                [13, 14],
            ], // Row 4
            [
                [15, 16],
                [17, 18],
            ], // Row 5
            [
                [19, 20],
                [21, 22],
            ], // Row 6
            [
                [23, 24],
                [25, 26],
            ], // Row 7
            [
                [27, 28],
                [29, 30],
            ], // Row 8
            [[31, 32, 33]], // Row 9: 3 seats
        ],
    },
    46: {
        totalSeats: 46,
        title: '46-Seater Matatu',
        layout: [
            [[1]], // Row 1: 1 seat (changed from [[1, 2]])
            [
                [2, 3],
                [4, 5],
            ], // Row 2: 2 left, aisle, 2 right (adjusted numbering)
            [
                [6, 7],
                [8, 9],
            ], // Row 3
            [
                [10, 11],
                [12, 13],
            ], // Row 4
            [
                [14, 15],
                [16, 17],
            ], // Row 5
            [
                [18, 19],
                [20, 21],
            ], // Row 6
            [
                [22, 23],
                [24, 25],
            ], // Row 7
            [
                [26, 27],
                [28, 29],
            ], // Row 8
            [
                [30, 31],
                [32, 33],
            ], // Row 9
            [
                [34, 35],
                [36, 37],
            ], // Row 10
            [
                [38, 39],
                [40, 41],
            ], // Row 11
            [[42, 43, 44, 45, 46]], // Row 12: 5 seats (adjusted to total 46)
        ],
    },
    52: {
        totalSeats: 52,
        title: '52-Seater Matatu',
        layout: [
            [[1]], // Row 1: 1 seat (changed from [[1, 2]])
            [
                [2, 3],
                [4, 5, 6],
            ], // Row 2: 2 left, aisle, 3 right (adjusted numbering)
            [
                [7, 8],
                [9, 10, 11],
            ], // Row 3
            [
                [12, 13],
                [14, 15, 16],
            ], // Row 4
            [
                [17, 18],
                [19, 20, 21],
            ], // Row 5
            [
                [22, 23],
                [24, 25, 26],
            ], // Row 6
            [
                [27, 28],
                [29, 30, 31],
            ], // Row 7
            [
                [32, 33],
                [34, 35, 36],
            ], // Row 8
            [
                [37, 38],
                [39, 40, 41],
            ], // Row 9
            [
                [42, 43],
                [44, 45, 46],
            ], // Row 10
            [[47, 48, 49, 50, 51, 52]], // Row 11: 6 seats (adjusted to total 52)
        ],
    },
    67: {
        totalSeats: 67,
        title: '67-Seater Matatu',
        layout: [
            [[1]], // Row 1: 1 seat (changed from [[1, 2]])
            [
                [2, 3],
                [4, 5, 6],
            ], // Row 2: 2 left, aisle, 3 right (adjusted numbering)
            [
                [7, 8],
                [9, 10, 11],
            ], // Row 3
            [
                [12, 13],
                [14, 15, 16],
            ], // Row 4
            [
                [17, 18],
                [19, 20, 21],
            ], // Row 5
            [
                [22, 23],
                [24, 25, 26],
            ], // Row 6
            [
                [27, 28],
                [29, 30, 31],
            ], // Row 7
            [
                [32, 33],
                [34, 35, 36],
            ], // Row 8
            [
                [37, 38],
                [39, 40, 41],
            ], // Row 9
            [
                [42, 43],
                [44, 45, 46],
            ], // Row 10
            [
                [47, 48],
                [49, 50, 51],
            ], // Row 11
            [
                [52, 53],
                [54, 55, 56],
            ], // Row 12
            [
                [57, 58],
                [59, 60, 61],
            ], // Row 13
            [[62, 63, 64, 65, 66, 67]], // Row 14: 6 seats (adjusted to total 67)
        ],
    },
};

// Configuration validation
Object.entries(matatuConfigs).forEach(([key, config]) => {
    const totalSeatsInLayout = config.layout.flat(2).length; // Flatten nested arrays
    if (totalSeatsInLayout !== config.totalSeats) {
        console.warn(`Mismatch in ${key}-seater: Expected ${config.totalSeats}, got ${totalSeatsInLayout}`);
    }
});
