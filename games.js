function resizeCanvasToDisplaySize(canvas) {
    // look up the size the canvas is being displayed
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // If it's resolution does not match change it
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
    }

    return false;
}

function translateSelectionToIndex(selection) {
    return selection[1] * 9 + selection[0] % 9;
}

function eventTargetHasClass(event, className) {
    return ~event.currentTarget.className.indexOf(className);
}

class Games {

    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            return;
        }
        this.COLUMNS = 9;
        this.ROWS = 9;
        this.CELL_SIZE = 32;
        this.RENDERER_OFFSET = 2;
        this.RENDERER_SIZE = 27.5;
        this.BORDER_BOLD = 2;
        this.SELECTION_COLOR = "rgba(250,22,22,.3)";
        this.selection = [];
        this.makePuzzle();
        this.calculateCanvasSize();
        this.setCanvasStyle();

        resizeCanvasToDisplaySize(this.canvas);
        this.initializeButtons();
        this.initializeContext();
        this.drawBoldGrid();
        this.drawGrid();
        this.drawPuzzle();
        this.canvasClientX = this.canvas.getClientRects()[0].x;
        this.canvasClientY = this.canvas.getClientRects()[0].y;
        this.registerTouchEvent();
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.borad[i][j] === 0) {
                    this.setSelection(i, j);
                    return;
                }
            }
        }
    }

    calculateCanvasSize() {
        this.canvasSize = this.COLUMNS * this.CELL_SIZE + this.BORDER_BOLD;
    }

    initializeButtons() {
        this.buttons = Array.from(document.querySelectorAll('.button-wrapper .btn-digit'));
        const self = this;
        this.buttons.forEach(function (element) {
            element.addEventListener('click', function (event) {
                    if (self.selection.length < 2) return;
                    if (eventTargetHasClass(event, 'disable')) return;

                    self.slove[translateSelectionToIndex(self.selection)] = parseInt(event.currentTarget.textContent);
                    self.clearSelection();
                    self.drawSelection();
                    self.drawNumber(event.currentTarget.textContent);
                }
            );
        })
    }

    drawBoldGrid() {
        this.context.lineWidth = 2;
        this.context.beginPath();
        const radius = this.context.lineWidth / 2;
        for (let i = 0, j = this.COLUMNS + 3; i < j; i += 3) {
            this.context.moveTo(i * this.CELL_SIZE + radius, 0);
            this.context.lineTo(i * this.CELL_SIZE + radius, this.canvasSize);
        }
        for (let i = 0, j = this.ROWS + 3; i < j; i += 3) {
            this.context.moveTo(0, i * this.CELL_SIZE + radius);
            this.context.lineTo(this.canvasSize, i * this.CELL_SIZE + radius);
        }
        this.context.strokeStyle = "peru";
        this.context.stroke();
    }

    drawGrid() {
        this.context.lineWidth = 1;
        this.context.beginPath();
        const radius = this.context.lineWidth / 2;
        for (let i = 0, j = this.COLUMNS; i < j; i++) {
            this.context.moveTo(i * this.CELL_SIZE + radius, 0);
            this.context.lineTo(i * this.CELL_SIZE + radius, this.canvasSize);
        }
        for (let i = 0, j = this.ROWS; i < j; i++) {
            this.context.moveTo(0, i * this.CELL_SIZE + radius);
            this.context.lineTo(this.canvasSize, i * this.CELL_SIZE + radius);
        }
        this.context.strokeStyle = "orange";
        this.context.stroke();
    }

    drawNumber(value) {

        this.context.fillStyle = "#000";
        this.context.fillText(value, 16 + this.selection[0] * 32, 16 + this.selection[1] * 32);
    }

    drawPuzzle() {
        this.context.font = "18px Georgia";
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const value = this.borad[i][j];
                if (!value) continue;
                this.context.fillText(value, 16 + i * 32, 16 + j * 32);
            }
        }
    }


    drawSelection() {
        this.context.fillStyle = this.SELECTION_COLOR;
        this.context.fillRect((this.selection[0] * (32) + 2.5),
            (this.selection[1] * (32) + 2.5),
            this.RENDERER_SIZE, this.RENDERER_SIZE)
    }

    findValidNumbers() {
        let numbers = [1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9];
        for (let j = 0; j < 9; j++) {
            console.log(this.selection[0]);
            const current = this.borad[this.selection[0]][j];
            if (current === 0) continue;
            const index = numbers.indexOf(current);
            if (index !== -1) numbers[index] = 0;
        }
        for (let j = 0; j < 9; j++) {
            const current = this.borad[j][this.selection[1]];
            if (current === 0) continue;
            const index = numbers.indexOf(current);
            if (index !== -1) numbers[index] = 0;
        }
        const startX = this.selection[0] - this.selection[0] % 3;
        const startY = this.selection[1] - this.selection[1] % 3;
        for (let i = startX; i < startX + 3; i++) {
            for (let j = startY; j < startY + 3; j++) {
                const current = this.borad[i][j];
                if (current === 0) continue;
                const index = numbers.indexOf(current);
                if (index !== -1) numbers[index] = 0;
            }
        }
        return numbers;
    }

    initializeContext() {
        this.context = this.canvas.getContext('2d');
    }

    makePuzzle() {
        this.puzzle = [null, null, null, null, null, null, null, 3, null, null, 2, null, null, 3, null, null, 1, null, null, null, 8, 7, null, 1, 2, null, 0, null, null, 7, null, 8, 0, 6, null, null, null, null, null, null, 1, null, null, 7, null, 6, null, null, null, null, null, null, null, 8, null, 4, null, null, null, null, null, null, null, null, null, 1, null, null, 6, null, null, null, null, 8, null, null, null, 2, 4, 0, 1];
        //makepuzzle(solvepuzzle(makeArray(81, null)));
        //console.log(solvepuzzle([1, 5, 0, 8, 2, 4, 7, 3, 5, 7, 2, 4, 0, 3, 5, 8, 1, 6, 5, 3, 8, 7, 6, 1, 2, 4, 0, 4, 1, 7, 2, 8, 0, 6, 5, 3, 8, 5, 2, 6, 1, 3, 0, 7, 4, 6, 0, 3, 4, 5, 7, 1, 2, 8, 2, 4, 5, 1, 0, 8, 3, 6, 7, 0, 7, 1, 3, 4, 6, 5, 8, 2, 3, 8, 6, 5, 7, 2, 4, 0, 1]));
        this.slove = Array.from(this.puzzle);
        this.borad = [];
        for (let i = 0; i < this.puzzle.length; i += 9) {
            let row = [];
            for (let j = 0; j < 9; j++) {
                row[j] = this.puzzle[i + j] || 0;
            }
            this.borad.push(row);
        }
    }

    clearSelection() {
        if (this.selection.length > 0) {
            this.context.clearRect((this.selection[0] * (32) + 2.5),
                (this.selection[1] * (32) + 1.5),
                this.RENDERER_SIZE + 1, this.RENDERER_SIZE + 1);
        }
    }

    registerTouchEvent() {
        this.canvas.addEventListener('click', event => {
            let x = event.clientX - this.canvasClientX;
            let y = event.clientY - this.canvasClientY;
            x = (x / 32) | 0;
            y = (y / 32) | 0;
            if (!this.borad[x][y]) {
                this.clearSelection();
                if (this.selection[0] !== x || this.selection[1] !== y) {
                    const number = this.slove[translateSelectionToIndex(this.selection)];
                    if (number)
                        this.drawNumber(number);
                }
                this.setSelection(x, y);
            }
        })
    }

    setSelection(x, y) {
        this.selection = [x, y];
        const numbers = this.findValidNumbers();
        for (let i = 0; i < numbers.length; i++) {
            if (numbers[i]) {
                this.buttons[i].className = 'btn';
            } else {
                this.buttons[i] && (this.buttons[i].className = 'btn disable');
            }
        }
        this.drawSelection();
    }

    setCanvasStyle() {
        const styleSize = this.canvasSize + 'px';
        this.canvas.style.width = styleSize;
        this.canvas.style.height = styleSize;
        this.canvas.style.position = 'absolute';
        this.gap = (document.body.clientWidth - this.canvasSize) >> 1;
        this.canvas.style.left = this.gap + 'px';
        this.canvas.style.top = Math.min(30, this.gap) + 'px';
        this.wrapperStyle = this.canvas.parentElement.style;
        this.wrapperStyle.paddingTop = (this.canvasSize + Math.min(30, this.gap)) + 'px';
        this.canvas.parentElement.querySelectorAll('.button-wrapper').forEach(element => element.style.width = styleSize);

    }
}

new Games('mainCanvas');