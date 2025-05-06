export const matatuConfigs = {
    '14': {
        totalSeats: 14,
        title: '14-Seater Matatu',
        layout: [[[1, 2]], [[3, 4, 5]], [[6], [7, 8]], [[9], [10, 11]], [[12, 13, 14]]],
    },
    '26': {
        totalSeats: 26,
        title: '26-Seater Matatu',
        layout: [
            [[1, 2]],
            [
                [3, 4],
                [5, 6],
            ],
            [
                [7, 8],
                [9, 10],
            ],
            [
                [11, 12],
                [13, 14],
            ],
            [
                [15, 16],
                [17, 18],
            ],
            [
                [19, 20],
                [21, 22],
            ],
            [
                [23, 24],
                [25, 26],
            ],
        ],
    },
    '33': {
        totalSeats: 33,
        title: '33-Seater Matatu',
        layout: [
            [[1, 2]],
            [
                [3, 4],
                [5, 6],
            ],
            [
                [7, 8],
                [9, 10],
            ],
            [
                [11, 12],
                [13, 14],
            ],
            [
                [15, 16],
                [17, 18],
            ],
            [
                [19, 20],
                [21, 22],
            ],
            [
                [23, 24],
                [25, 26],
            ],
            [
                [27, 28],
                [29, 30],
            ],
            [[31, 32, 33]],
        ],
    },
    '46': {
        totalSeats: 46,
        title: '46-Seater Matatu',
        layout: [
            [[1]],
            [
                [2, 3],
                [4, 5],
            ],
            [
                [6, 7],
                [8, 9],
            ],
            [
                [10, 11],
                [12, 13],
            ],
            [
                [14, 15],
                [16, 17],
            ],
            [
                [18, 19],
                [20, 21],
            ],
            [
                [22, 23],
                [24, 25],
            ],
            [
                [26, 27],
                [28, 29],
            ],
            [
                [30, 31],
                [32, 33],
            ],
            [
                [34, 35],
                [36, 37],
            ],
            [
                [38, 39],
                [40, 41],
            ],
            [[42, 43, 44, 45, 46]],
        ],
    },
    '52': {
        totalSeats: 52,
        title: '52-Seater Matatu',
        layout: [
            [[1]],
            [
                [2, 3],
                [4, 5, 6],
            ],
            [
                [7, 8],
                [9, 10, 11],
            ],
            [
                [12, 13],
                [14, 15, 16],
            ],
            [
                [17, 18],
                [19, 20, 21],
            ],
            [
                [22, 23],
                [24, 25, 26],
            ],
            [
                [27, 28],
                [29, 30, 31],
            ],
            [
                [32, 33],
                [34, 35, 36],
            ],
            [
                [37, 38],
                [39, 40, 41],
            ],
            [
                [42, 43],
                [44, 45, 46],
            ],
            [[47, 48, 49, 50, 51, 52]],
        ],
    },
    '67': {
        totalSeats: 67,
        title: '67-Seater Matatu',
        layout: [
            [[1]],
            [
                [2, 3],
                [4, 5, 6],
            ],
            [
                [7, 8],
                [9, 10, 11],
            ],
            [
                [12, 13],
                [14, 15, 16],
            ],
            [
                [17, 18],
                [19, 20, 21],
            ],
            [
                [22, 23],
                [24, 25, 26],
            ],
            [
                [27, 28],
                [29, 30, 31],
            ],
            [
                [32, 33],
                [34, 35, 36],
            ],
            [
                [37, 38],
                [39, 40, 41],
            ],
            [
                [42, 43],
                [44, 45, 46],
            ],
            [
                [47, 48],
                [49, 50, 51],
            ],
            [
                [52, 53],
                [54, 55, 56],
            ],
            [
                [57, 58],
                [59, 60, 61],
            ],
            [[62, 63, 64, 65, 66, 67]],
        ],
    },
};
export const validCapacities = Object.keys(matatuConfigs);
export function validateCapacity(capacity) {
    const capacityStr = String(capacity);
    return validCapacities.includes(capacityStr) ? capacityStr : '14';
}
// Configuration validation
Object.entries(matatuConfigs).forEach(([key, config]) => {
    const totalSeatsInLayout = config.layout.flat(2).length;
    if (totalSeatsInLayout !== config.totalSeats) {
        console.warn(`Mismatch in ${key}-seater: Expected ${config.totalSeats}, got ${totalSeatsInLayout}`);
    }
});
