function makepuzzle(board) {
    const puzzle = [];
    const deduced = makeArray(81, null);
    const order = [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        46,
        47,
        48,
        49,
        50,
        51,
        52,
        53,
        54,
        55,
        56,
        57,
        58,
        59,
        60,
        61,
        62,
        63,
        64,
        65,
        66,
        67,
        68,
        69,
        70,
        71,
        72,
        73,
        74,
        75,
        76,
        77,
        78,
        79,
        80
    ];

    shuffleArray(order);

    for (var i = 0; i < order.length; i++) {
        const pos = order[i];

        if (deduced[pos] == null) {
            puzzle.push({pos: pos, num: board[pos]});
            deduced[pos] = board[pos];
            deduce(deduced);
        }
    }

    shuffleArray(puzzle);

    for (var i = puzzle.length - 1; i >= 0; i--) {
        const e = puzzle[i];
        removeElement(puzzle, i);

        const rating = checkpuzzle(boardforentries(puzzle), board);
        if (rating === -1) {
            puzzle.push(e);
        }
    }

    return boardforentries(puzzle);
}

function ratepuzzle(puzzle, samples) {
    let total = 0;

    for (let i = 0; i < samples; i++) {
        const tuple = solveboard(puzzle);

        if (tuple.answer == null) {
            return -1;
        }

        total += tuple.state.length;
    }

    return total / samples;
}

function checkpuzzle(puzzle, board) {
    if (board === undefined) {
        board = null;
    }

    const tuple1 = solveboard(puzzle);
    if (tuple1.answer == null) {
        return -1;
    }

    if (board != null && boardmatches(board, tuple1.answer) === false) {
        return -1;
    }

    const difficulty = tuple1.state.length;
    const tuple2 = solvenext(tuple1.state);

    if (tuple2.answer != null) {
        return -1;
    }

    return difficulty;
}

function solvepuzzle(board) {
    return solveboard(board).answer;
}

function solveboard(original) {
    const board = [].concat(original);
    const guesses = deduce(board);

    if (guesses == null) {
        return {state: [], answer: board};
    }

    const track = [{guesses: guesses, count: 0, board: board}];
    return solvenext(track);
}

function solvenext(remembered) {
    while (remembered.length > 0) {
        const tuple1 = remembered.pop();

        if (tuple1.count >= tuple1.guesses.length) {
            continue;
        }

        remembered.push({guesses: tuple1.guesses, count: tuple1.count + 1, board: tuple1.board});
        const workspace = [].concat(tuple1.board);
        const tuple2 = tuple1.guesses[tuple1.count];

        workspace[tuple2.pos] = tuple2.num;

        const guesses = deduce(workspace);

        if (guesses == null) {
            return {state: remembered, answer: workspace};
        }

        remembered.push({guesses: guesses, count: 0, board: workspace});
    }

    return {state: [], answer: null};
}

function deduce(board) {
    while (true) {
        let stuck = true;
        let guess = null;
        let count = 0;

        // fill in any spots determined by direct conflicts
        const tuple1 = figurebits(board);
        let allowed = tuple1.allowed;
        let needed = tuple1.needed;

        for (var pos = 0; pos < 81; pos++) {
            if (board[pos] == null) {
                var numbers = listbits(allowed[pos]);
                if (numbers.length === 0) {
                    return [];
                } else if (numbers.length === 1) {
                    board[pos] = numbers[0];
                    stuck = false;
                } else if (stuck === true) {
                    var t = numbers.map(function (val, key) {
                        return {pos: pos, num: val};
                    });

                    const tuple2 = pickbetter(guess, count, t);
                    guess = tuple2.guess;
                    count = tuple2.count;
                }
            }
        }

        if (stuck === false) {
            const tuple3 = figurebits(board);
            allowed = tuple3.allowed;
            needed = tuple3.needed;
        }

        // fill in any spots determined by elimination of other locations
        for (let axis = 0; axis < 3; axis++) {
            for (let x = 0; x < 9; x++) {
                var numbers = listbits(needed[axis * 9 + x]);

                for (let i = 0; i < numbers.length; i++) {
                    const n = numbers[i];
                    const bit = 1 << n;
                    const spots = [];

                    for (let y = 0; y < 9; y++) {
                        var pos = posfor(x, y, axis);
                        if (allowed[pos] & bit) {
                            spots.push(pos);
                        }
                    }

                    if (spots.length === 0) {
                        return [];
                    } else if (spots.length === 1) {
                        board[spots[0]] = n;
                        stuck = false;
                    } else if (stuck) {
                        var t = spots.map(function (val, key) {
                            return {pos: val, num: n};
                        });

                        const tuple4 = pickbetter(guess, count, t);
                        guess = tuple4.guess;
                        count = tuple4.count;
                    }
                }
            }
        }

        if (stuck === true) {
            if (guess != null) {
                shuffleArray(guess);
            }

            return guess;
        }
    }
}

function figurebits(board) {
    const needed = [];
    const allowed = board.map(function (val, key) {
        return val == null ? 511 : 0;
    }, []);

    for (let axis = 0; axis < 3; axis++) {
        for (let x = 0; x < 9; x++) {
            const bits = axismissing(board, x, axis);
            needed.push(bits);

            for (let y = 0; y < 9; y++) {
                const pos = posfor(x, y, axis);
                allowed[pos] = allowed[pos] & bits;
            }
        }
    }

    return {allowed: allowed, needed: needed};
}

function posfor(x, y, axis) {
    if (axis === undefined) {
        axis = 0;
    }

    if (axis === 0) {
        return x * 9 + y;
    } else if (axis === 1) {
        return y * 9 + x;
    }

    return ([0, 3, 6, 27, 30, 33, 54, 57, 60][x] + [0, 1, 2, 9, 10, 11, 18, 19, 20][y])
}

function axisfor(pos, axis) {
    if (axis === 0) {
        return Math.floor(pos / 9);
    } else if (axis === 1) {
        return pos % 9;
    }

    return Math.floor(pos / 27) * 3 + Math.floor(pos / 3) % 3;
}

function axismissing(board, x, axis) {
    let bits = 0;

    for (let y = 0; y < 9; y++) {
        const e = board[posfor(x, y, axis)];

        if (e != null) {
            bits |= 1 << e;
        }
    }

    return 511 ^ bits;
}

function listbits(bits) {
    const list = [];
    for (let y = 0; y < 9; y++) {
        if ((bits & (1 << y)) !== 0) {
            list.push(y);
        }
    }

    return list;
}

function allowed(board, pos) {
    let bits = 511;

    for (let axis = 0; axis < 3; axis++) {
        const x = axisfor(pos, axis);
        bits = bits & axismissing(board, x, axis);
    }

    return bits;
}

// TODO: make sure callers utilize the return value correctly
function pickbetter(b, c, t) {
    if (b == null || t.length < b.length) {
        return {guess: t, count: 1};
    } else if (t.length > b.length) {
        return {guess: b, count: c};
    } else if (randomInt(c) === 0) {
        return {guess: t, count: c + 1};
    }

    return {guess: b, count: c + 1};
}

function boardforentries(entries) {
    const board = new Array(81).fill(null);

    for (let i = 0; i < entries.length; i++) {
        const item = entries[i];
        const pos = item.pos;
        board[pos] = item.num;
    }

    return board;
}

function boardmatches(b1, b2) {
    for (let i = 0; i < 81; i++) {
        if (b1[i] !== b2[i]) {
            return false;
        }
    }

    return true;
}

function randomInt(max) {
    return Math.floor(Math.random() * (max + 1));
}

function shuffleArray(original) {
    // Swap each element with another randomly selected one.
    for (let i = 0; i < original.length; i++) {
        let j = i;
        while (j === i) {
            j = Math.floor(Math.random() * original.length);
        }
        const contents = original[i];
        original[i] = original[j];
        original[j] = contents;
    }
}

function removeElement(array, from, to) {
    const rest = array.slice((to || from) + 1 || array.length);
    array.length = from < 0 ? array.length + from : from;
    return array.push.apply(array, rest);
}

function makeArray(length, value) {
    return new Array(length).fill(value);
}

// module.exports = {
//     makepuzzle  : function () { return makepuzzle(solvepuzzle(makeArray(81, null))); },
//     solvepuzzle : solvepuzzle,
//     ratepuzzle  : ratepuzzle,
//     posfor      : posfor
// };