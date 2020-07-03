let mIsWeChat;


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


function showModalAlert(message, btnLabel, callback) {
    const div = document.createElement('div');

    const modAlertMask = document.createElement('div');
    modAlertMask.className = 'mod_alert_mask show';
    div.appendChild(modAlertMask);

    const modAlert = document.createElement('div');
    modAlert.className = 'mod_alert fixed show';
    div.appendChild(modAlert);

    const regular = document.createElement('p');
    regular.className = 'regular';
    modAlert.appendChild(regular);
    regular.appendChild(document.createTextNode(message));

    const btns = document.createElement('div');
    btns.className = 'btns';
    modAlert.appendChild(btns);

    const btn2 = document.createElement('div');
    btn2.className = 'btn btn_2';
    btns.appendChild(btn2);
    btn2.appendChild(document.createTextNode('返回'));

    const btn1 = document.createElement('div');
    btn1.className = 'btn btn_1';
    btns.appendChild(btn1);
    btn1.appendChild(document.createTextNode(btnLabel || '删除'));

    btn2.addEventListener('click', function () {
        div.remove();
    });
    modAlertMask.addEventListener('click', function () {
        div.remove();
    });

    callback && btn1.addEventListener('click', ev => {
        callback(ev);
        div.remove();
    });
    document.body.appendChild(div);
}

function showModal(message) {
    const div = document.createElement('div');

    const modAlertMask = document.createElement('div');
    modAlertMask.className = 'mod_alert_mask show';
    div.appendChild(modAlertMask);

    const modAlert = document.createElement('div');
    modAlert.className = 'mod_alert fixed show';
    div.appendChild(modAlert);

    const regular = document.createElement('p');
    regular.className = 'regular';
    modAlert.appendChild(regular);
    regular.appendChild(document.createTextNode(message));

    const btns = document.createElement('div');
    btns.className = 'btns';
    modAlert.appendChild(btns);

    const btn2 = document.createElement('div');
    btn2.className = 'btn btn_2';
    btns.appendChild(btn2);
    btn2.appendChild(document.createTextNode('返回'));


    btn2.addEventListener('click', function () {
        div.remove();
    });
    modAlertMask.addEventListener('click', function () {
        div.remove();
    });
    document.body.appendChild(div);
}

function isWeChat() {
    if (mIsWeChat === null)
        mIsWeChat =
            navigator.userAgent.toLowerCase().indexOf('micromessenger') !== -1;
    return mIsWeChat;
}

function removeCache(name) {
    if (isWeChat()) {
        eraseCookie(name);
    } else {
        localStorage.removeItem(name);
    }
}

function saveCache(name, value) {
    if (isWeChat()) {
        setCookie(name, value, 365);
    } else {
        localStorage.setItem(name, value);
    }
}

function getCache(name) {
    if (isWeChat()) {
        return getCookie(name);
    } else {
        return localStorage.getItem(name);
    }
}

function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999;';
}

function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function setCookie(name, value, days) {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/';
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
        this.calculateCanvasSize();
        this.setCanvasStyle();

        resizeCanvasToDisplaySize(this.canvas);
        this.initializeButtons();
        this.initializeContext();

        this.canvasClientX = this.canvas.getClientRects()[0].x;
        this.canvasClientY = this.canvas.getClientRects()[0].y;
        this.registerTouchEvent();

        this.makePuzzle();


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
        });

        const btnRestart = document.querySelector('.btn-restart');
        btnRestart.addEventListener('click', event => {
            showModalAlert('确定要重新开始游戏吗？', "确定", () => {
                this.restart();
            });
        });
        const btnSave = document.querySelector('.btn-save');
        btnSave.addEventListener('click', event => {
            saveCache("puzzle", JSON.stringify(this.puzzle));
            saveCache("slove", JSON.stringify(this.slove));
            showModal('游戏成功存档！');
        });
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
                const value = this.borad[j][i];
                if (!value) continue;

                if (!this.puzzle[translateSelectionToIndex([i, j])]) {
                    console.log(j, i, translateSelectionToIndex([j, i]), value);
                    this.context.fillStyle = "#000";
                } else {
                    this.context.fillStyle = "#a8a8a8";
                }
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
        const puzzleString = getCache('puzzle');
        const sloveString = getCache('slove');
        try {
            const puzzle = JSON.parse(puzzleString);
            if (Array.isArray(puzzle) && puzzle.length === 81) {
                this.puzzle = puzzle;
            }
            const slove = JSON.parse(sloveString);
            if (Array.isArray(slove) && slove.length === 81) {
                this.slove = slove;
            }
        } catch (e) {
        }
        this.puzzle || (this.puzzle = sudoku.generate('very-hard').split('').map(v => {
                const value = parseInt(v);
                if (isNaN(value)) return null;
                return value;
            }
        ))
        ;
        console.log(this.puzzle);
        this.setBoard();
    }

    restart() {
        this.puzzle = makepuzzle(solvepuzzle(makeArray(81, null)));
        //console.log(solvepuzzle([1, 5, 0, 8, 2, 4, 7, 3, 5, 7, 2, 4, 0, 3, 5, 8, 1, 6, 5, 3, 8, 7, 6, 1, 2, 4, 0, 4, 1, 7, 2, 8, 0, 6, 5, 3, 8, 5, 2, 6, 1, 3, 0, 7, 4, 6, 0, 3, 4, 5, 7, 1, 2, 8, 2, 4, 5, 1, 0, 8, 3, 6, 7, 0, 7, 1, 3, 4, 6, 5, 8, 2, 3, 8, 6, 5, 7, 2, 4, 0, 1]));
        this.setBoard();
    }

    setBoard() {
        this.context.clearRect(0, 0, this.canvasSize, this.canvasSize);
        this.selection = [];

        this.slove = this.slove || Array.from(this.puzzle);
        this.borad = [];
        for (let i = 0; i < this.slove.length; i += 9) {
            let row = [];
            for (let j = 0; j < 9; j++) {
                row[j] = this.slove[i + j] || 0;
            }
            this.borad.push(row);
        }
        this.drawBoldGrid();
        this.drawGrid();
        this.drawPuzzle();
        this.setStartSelection();
    }

    setStartSelection() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (!this.borad[i][j]) {
                    this.setSelection(j, i);
                    return;
                }
            }
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
            if (!this.borad[y][x] || (!this.puzzle[translateSelectionToIndex([x, y])])) {
                if (this.selection[0] !== x || this.selection[1] !== y) {
                    this.clearSelection();
                    const number = this.slove[translateSelectionToIndex(this.selection)];
                    if (number)
                        this.drawNumber(number);
                    this.setSelection(x, y);
                }
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