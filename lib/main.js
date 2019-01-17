// Текущий ход:
// 0 - ход игрока
// 1 - ход ИИ
let currentTurn = 0;

// Уровень сложности [x, y]:
// x: {
//   0 - легкий (противник стреляет наугад)
//   1 - средний (противник знает, как уничтожить найденный корабль, но не знает про буферные зоны)
//   2 - сложный (противник знает, как уничтожить найденный корабль и про буферные зоны)
// }
// y: {
//   Время реакции ИИ (1000мс)
// }
let enemyLevel = [];

// Имя игрока
let playerName = '';

// Память ИИ
let enemyMemory = [];

let myField, myShips, enemyField, enemyShips = [[], [], [], []];

// Функция старта игры
function startGame(PN, EL) {

    currentTurn = 0;
    enemyMemory = [];
    myField, myShips, enemyField, enemyShips = [[], [], [], []];
    $('.battle-ship-4').removeClass('dead').text(1);
    $('.battle-ship-3').removeClass('dead').text(2);
    $('.battle-ship-2').removeClass('dead').text(3);
    $('.battle-ship-1').removeClass('dead').text(4);

    playerName = PN;
    enemyLevel = EL;

    $('.battle-area-table').empty();
    $('.table-labels-h').empty();
    $('.table-labels-v').empty();

    [myField, myShips] = generateField('myField');
    [enemyField, enemyShips] = generateField('enemyField');

    console.log('enemyShips', enemyShips);

    enemyMemory = initMemory();

    $('.mask').addClass('hidden');
    $('.menu').addClass('hidden-top');


    setTimeout(() => {
        $('.mask').addClass('destroyed');
    }, 300);

    // Показываем информацию о кораблях
    setTimeout(() => { $('.battle-ship > .ship').removeClass('hidden') }, 300);

    console.log('playerName', playerName);
    console.log('enemyLevel', enemyLevel);
    console.log('[myField, myShips]', [myField, myShips]);
    console.log('[enemyField, enemyShips]', [enemyField, enemyShips]);
    console.log('enemyMemory', enemyMemory);
    console.log('currentTurn', currentTurn);

    //
    // ОБРАБОТЧИКИ СОБЫТИЙ:
    //

    // Обработка событий входа-выхода стрелки мыши на игровое поле (для визуализации)
    $('.player-field').find($('.ship:not(.battle-ship-count)')).mouseenter(function (elem) {
        $(`.p-h-${this.attributes[1].value}`).addClass('label-hover');
        $(`.p-v-${this.attributes[2].value}`).addClass('label-hover');
    }).mouseleave(function (elem) {
        $(`.p-h-${this.attributes[1].value}`).removeClass('label-hover');
        $(`.p-v-${this.attributes[2].value}`).removeClass('label-hover');
    });
    $('.ai-field').find($('.battle-area-cell')).mouseenter(function (elem) {
        $(`.ai-h-${this.attributes[1].value}`).addClass('label-hover');
        $(`.ai-v-${this.attributes[2].value}`).addClass('label-hover');
    }).mouseleave(function (elem) {
        $(`.ai-h-${this.attributes[1].value}`).removeClass('label-hover');
        $(`.ai-v-${this.attributes[2].value}`).removeClass('label-hover');
    });

    // Обработка нажатия на поле противника (ИИ)
    $('.ai-field').find($('.battle-area-cell')).click(function () {
        if (currentTurn === 0) {
            let [xPos, yPos] = [this.attributes[1].value, this.attributes[2].value];
            shoot(enemyShips, enemyField, [xPos, yPos]);
        }
    });
}

// Подготовка памяти ИИ
function initMemory() {
    let map = fillFieldWithZeros();
    return {
        cp: null,
        hits: 0,
        direction: 0,
        counts: 1,
        currentShipIndex: -1,
        map: map
    }
}

// Генерирует поле
function generateField(fieldType) {
    let playerField = fillFieldWithZeros();
    let playerShips = {
        one : 4,
        two : 3,
        three : 2,
        four : 1
    };
    let shipsPosition = buildForce(playerField, playerShips);
    placeForce(playerField, fieldType);
    fillLabels(fieldType);
    return [playerField, shipsPosition];
}

// Заполняет массив 10x10 нулями
function fillFieldWithZeros() {
    let array = [];
    for (let i = 0; i < 10; i++) {
        let row = [];
        for (let j = 0; j < 10; j++) {
            row.push(0);
        }
        array.push(row);
    }
    return array;
}

// Функция начала создания войска
function buildForce(playerField, playerShips) {
    let isBattleAreaPrepared = false;
    let shipsPosition = [];
    do {
        let currentShipType = 0;

        if (playerShips.four !== 0) {
            currentShipType = 4;
            playerShips.four--;
        } else if (playerShips.three !== 0) {
            currentShipType = 3;
            playerShips.three--;
        } else if (playerShips.two !== 0) {
            currentShipType = 2;
            playerShips.two--;
        } else if (playerShips.one !== 0) {
            currentShipType = 1;
            playerShips.one--;
        }

        if (currentShipType !== 0) {
            let solved = false;
            let [xPosition, yPosition, orientation, buffer, shipLocation, ship] = [0, 0, '', [], [], []];
            while (!solved) {
                [xPosition, yPosition, orientation] = [oneOfTen(), oneOfTen(), getRandomOrientation()];
                buffer = createBuffer(xPosition, yPosition, orientation, currentShipType);
                [shipLocation, ship] = createShipLocation(xPosition, yPosition, orientation, currentShipType);
                if (buffer[1][0] < 10 && buffer[1][1] < 10) {
                    solved = insertShip(playerField, buffer, shipLocation);
                }
            }
            shipsPosition.push(ship);

            console.log('currentShipType', currentShipType);
            console.log('startPosition', [xPosition, yPosition]);
            console.log('orientation', orientation);
            console.log('buffer', buffer);
            console.log('playerField', playerField);
        } else
            isBattleAreaPrepared = true;
    } while (!isBattleAreaPrepared)
        return shipsPosition;
}

// Функция вставки корабля на поле
function insertShip(playerField, buffer, shipLocation) {
    let bufferClear = true;
    for (let i = buffer[0][1]; i <= buffer[1][1]; i++){
        for (let j = buffer[0][0]; j <= buffer[1][0]; j++){
            if (playerField[i][j] === 2){
                bufferClear = false;
                break;
            }
        }
    }
    if (bufferClear) {
        for (let i = buffer[0][1]; i <= buffer[1][1]; i++){
            for (let j = buffer[0][0]; j <= buffer[1][0]; j++){
                playerField[i][j] = 1;
            }
        }
        for (let i = shipLocation[0][1]; i <= shipLocation[1][1]; i++){
            for (let j = shipLocation[0][0]; j <= shipLocation[1][0]; j++){
                playerField[i][j] = 2;
            }
        }
    }
    return bufferClear;
}

// Функция создания координат буферной зоны корабля (1 клетка вокруг корабля) на поле
function createBuffer(xPosition, yPosition, orientation, currentShipType) {
    let startX = xPosition > 0 ? xPosition - 1 : xPosition;
    let startY = yPosition > 0 ? yPosition - 1 : yPosition;
    let endX = orientation === 'v'
        ? xPosition < 9
            ? xPosition + 1
            : xPosition
        : xPosition + currentShipType - 1 < 9
            ? xPosition + currentShipType
            : xPosition + currentShipType - 1;
    let endY = orientation === 'h'
        ? yPosition < 9
            ? yPosition + 1
            : yPosition
        : yPosition + currentShipType - 1 < 9
            ? yPosition + currentShipType
            : yPosition + currentShipType - 1;
    return [[startX, startY], [endX, endY]];
}

// Функция создания координат корабля на поле
function createShipLocation(xPosition, yPosition, orientation, currentShipType) {
    let startX = xPosition;
    let startY = yPosition;
    let endX = orientation === 'v'
        ? xPosition
        : xPosition + currentShipType - 1;
    let endY = orientation === 'h'
        ? yPosition
        : yPosition + currentShipType - 1;
    let ship = [];
    for (let i = 0; i < currentShipType; i++) {
        ship.push({
            x: orientation === 'v' ? xPosition : xPosition + i,
            y: orientation === 'h' ? yPosition : yPosition + i,
            dead: false
        });
    }
    return [[[startX, startY], [endX, endY]], ship];
}

// Функция размещения кораблей на игровом поле
function placeForce(playerField, fieldType) {
    for (let i = 0; i < 10; i++){
        for (let j = 0; j < 10; j++) {
            let cell = `<div class="battle-area-cell${playerField[i][j] === 2 && fieldType === 'myField' ? ' ship' : ''}" 
                pos-x="${j}" pos-y="${i}"></div>`;
            if (fieldType === 'myField')
                $('.player-field').find($('.battle-area-table')).append(cell);
            else if (fieldType === 'enemyField')
                $('.ai-field').find($('.battle-area-table')).append(cell);
        }
    }
}

// Функция заполнения значений координат поля (по краям)
function fillLabels(fieldType) {
    let labelsV = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    let labelsH = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К'];
    for (let i in labelsV){
        if (fieldType === 'myField') {
            let cell = `<div class="label-cell cell-vertical p-v-${i}">${labelsV[i]}</div>`;
            $('.player-field').find($('.table-labels-v')).append(cell);
        } else if (fieldType === 'enemyField') {
            let cell = `<div class="label-cell cell-vertical ai-v-${i}">${labelsV[i]}</div>`;
            $('.ai-field').find($('.table-labels-v')).append(cell);
        }
    }
    for (let i in labelsH){
        if (fieldType === 'myField') {
            let cell = `<div class="label-cell cell-horizontal p-h-${i}">${labelsH[i]}</div>`;
            $('.player-field').find($('.table-labels-h')).append(cell);
        } else if (fieldType === 'enemyField') {
            let cell = `<div class="label-cell cell-horizontal ai-h-${i}">${labelsH[i]}</div>`;
            $('.ai-field').find($('.table-labels-h')).append(cell);
        }
    }
}

// Функция перехода хода + визуальное отображение перехода хода
function nextTurn(currentTurn) {
    switch (currentTurn){
        case 0:
            $('.player-field').removeClass('active-area');
            $('.ai-field').addClass('active-area');
            $('.arrow-svg').removeClass('arrow-left');
            $('.arrow-svg').addClass('arrow-right');
            currentTurn = 1;

            setTimeout(() => {
                enemyTurn(enemyLevel);
            }, enemyLevel[1]);

            break;
        case 1:
            $('.ai-field').removeClass('active-area');
            $('.player-field').addClass('active-area');
            $('.arrow-svg').removeClass('arrow-right');
            $('.arrow-svg').addClass('arrow-left');
            currentTurn = 0;
            break;
    }
    return currentTurn;
}


// Функция хода врага
function enemyTurn(enemyLevel) {
    let xPos, yPos;
    let solved = false;
    do {
        switch (enemyLevel[0]) {
            case 0:
                [xPos, yPos] = [oneOfTen(), oneOfTen()];
                if (enemyMemory.map[yPos][xPos] === 0) {
                    solved = true;
                }
                break;
            case 1:
            case 2:
                if (enemyMemory.cp === null) {
                    [xPos, yPos] = [oneOfTen(), oneOfTen()];
                    if (enemyMemory.map[yPos][xPos] === 0) {
                        solved = true;
                    }
                } else {
                    switch (enemyMemory.direction) {
                        case 0:
                            [xPos, yPos] = [enemyMemory.cp[0], enemyMemory.cp[1] + enemyMemory.counts];
                            break;
                        case 1:
                            [xPos, yPos] = [enemyMemory.cp[0] + enemyMemory.counts, enemyMemory.cp[1]];
                            break;
                        case 2:
                            [xPos, yPos] = [enemyMemory.cp[0], enemyMemory.cp[1] - enemyMemory.counts];
                            break;
                        case 3:
                            [xPos, yPos] = [enemyMemory.cp[0] - enemyMemory.counts, enemyMemory.cp[1]];
                            break;
                    }
                    if (yPos >= 0 && yPos <= 9 && xPos >= 0 && xPos <= 9) {
                        if (enemyMemory.map[yPos][xPos] === 0) {
                            solved = true;
                        } else if (enemyMemory.hits === 1) {
                            if (enemyMemory.direction !== 3)
                                enemyMemory.direction++;
                            else enemyMemory.direction = 0;
                        } else {
                            switch (enemyMemory.direction) {
                                case 0:
                                    enemyMemory.direction = 2;
                                    break;
                                case 1:
                                    enemyMemory.direction = 3;
                                    break;
                                case 2:
                                    enemyMemory.direction = 0;
                                    break;
                                case 3:
                                    enemyMemory.direction = 1;
                                    break;
                            }
                            enemyMemory.counts = 1;
                        }
                    } else {
                        if (enemyMemory.hits === 1) {
                            if (enemyMemory.direction !== 3)
                                enemyMemory.direction++;
                            else enemyMemory.direction = 0;
                        } else {
                            switch (enemyMemory.direction) {
                                case 0:
                                    enemyMemory.direction = 2;
                                    break;
                                case 1:
                                    enemyMemory.direction = 3;
                                    break;
                                case 2:
                                    enemyMemory.direction = 0;
                                    break;
                                case 3:
                                    enemyMemory.direction = 1;
                                    break;
                            }
                            enemyMemory.counts = 1;
                        }
                    }
                }
            break;
        }
    } while (!solved)
        console.log(enemyMemory);

    shoot(myShips, myField, [xPos, yPos]);
}

// Функция выстрела в поле по входным координатам + визуального обновления поля
function shoot(ships, field, coordinates) {
    let [xPos, yPos] = coordinates;

    let currentField = currentTurn === 1 ? $('.ai-field') : $('.player-field');
    let enemyField = currentTurn === 0 ? $('.ai-field') : $('.player-field');

    let currentCell = enemyField.find($(`.battle-area-cell[pos-x="${xPos}"][pos-y="${yPos}"]`));

    if ((!currentCell.hasClass('ship') || currentTurn === 1) && !currentCell.hasClass('miss')) {

        let deadCount = 0;
        let oneMore = false;

        if (field[yPos][xPos] === 2) {
            if (currentTurn === 1) {
                if (enemyLevel[0] !== 0) {
                    if (enemyMemory.hits === 0) {
                        enemyMemory.cp = [xPos, yPos];
                    } else {
                        enemyMemory.counts++;
                    }
                    enemyMemory.hits++;
                }
                enemyMemory.map[yPos][xPos] = 2;
            }

            for (let ship of ships) {
                for (let shipPoint of ship) {
                    if (shipPoint.x == xPos && shipPoint.y == yPos) {
                        shipPoint.dead = true;
                        oneMore = true;
                        if (currentTurn === 1 && enemyLevel[0] !== 0) {
                            enemyMemory.currentShipIndex = ships.indexOf(ship);
                        }
                    }
                }
            }

            enemyField.find($('.battle-ship-4')).text(1);
            enemyField.find($('.battle-ship-3')).text(2);
            enemyField.find($('.battle-ship-2')).text(3);
            enemyField.find($('.battle-ship-1')).text(4);

            for (let ship of ships) {
                let deadShipCoord = [];
                for (let shipPoint of ship) {
                    if (shipPoint.dead === true) {
                        deadShipCoord.push([shipPoint.x, shipPoint.y]);
                    }
                }
                for (let deadShipLocation of deadShipCoord) {
                    enemyField.find($(`.battle-area-cell[pos-x="${deadShipLocation[0]}"][pos-y="${deadShipLocation[1]}"]`))
                        .removeClass(ship.length === deadShipCoord.length ? 'injured' : '')
                        .addClass(ship.length === deadShipCoord.length ? 'dead' : 'injured')
                        .addClass('ship');
                }
                if (ship.length === deadShipCoord.length) {
                    deadCount++;
                    enemyField.find($(`.battle-ship-${ship.length}`))
                        .text(parseInt(enemyField.find($(`.battle-ship-${ship.length}`)).text()) - 1);
                    if (enemyField.find($(`.battle-ship-${ship.length}`)).text() == 0) {
                        enemyField.find($(`.battle-ship-${ship.length}`)).addClass('dead').addClass('hidden');
                    }
                    if (currentTurn === 1 && ships[enemyMemory.currentShipIndex] === ship && enemyLevel[0] !== 0) {
                        if (enemyLevel[0] === 2) {
                            let xStart = ships[enemyMemory.currentShipIndex][0].x !== 0 ? ships[enemyMemory.currentShipIndex][0].x - 1 : 0;
                            let yStart = ships[enemyMemory.currentShipIndex][0].y !== 0 ? ships[enemyMemory.currentShipIndex][0].y - 1 : 0;
                            let xEnd = ships[enemyMemory.currentShipIndex][ships[enemyMemory.currentShipIndex].length - 1].x !== 9 ? ships[enemyMemory.currentShipIndex][ships[enemyMemory.currentShipIndex].length - 1].x + 1 : 9;
                            let yEnd = ships[enemyMemory.currentShipIndex][ships[enemyMemory.currentShipIndex].length - 1].y !== 9 ? ships[enemyMemory.currentShipIndex][ships[enemyMemory.currentShipIndex].length - 1].y + 1 : 9;
                            for (let i = xStart; i <= xEnd; i++) {
                                for (let j = yStart; j <= yEnd; j++) {
                                    enemyMemory.map[j][i] = 1;
                                }
                            }

                        }
                        enemyMemory.cp = null;
                        enemyMemory.hits = 0;
                        enemyMemory.direction = 0;
                        enemyMemory.counts = 1;
                        enemyMemory.currentShipIndex = -1;
                    }
                }
            }

        } else {
            enemyField.find($(`.battle-area-cell[pos-x="${xPos}"][pos-y="${yPos}"]`)).addClass('miss');
            if (currentTurn === 1) {
                enemyMemory.map[yPos][xPos] = 1;
                if (enemyLevel[0] !== 0) {
                    if (enemyMemory.cp !== null) {
                        if (enemyMemory.hits === 1) {
                            if (enemyMemory.direction !== 3)
                                enemyMemory.direction++;
                            else enemyMemory.direction = 0;
                        } else {
                            switch (enemyMemory.direction) {
                                case 0:
                                    enemyMemory.direction = 2;
                                    break;
                                case 1:
                                    enemyMemory.direction = 3;
                                    break;
                                case 2:
                                    enemyMemory.direction = 0;
                                    break;
                                case 3:
                                    enemyMemory.direction = 1;
                                    break;
                            }
                            enemyMemory.counts = 1;
                        }
                    }
                }
            }
        }

        if (deadCount === 10) {
            $('.mask').removeClass('destroyed');
            setTimeout(() => {
                $('.mask').removeClass('hidden');
                $('.result').removeClass('hidden-top');
                $('.result-info').text(currentTurn === 0 ? `${playerName} победил!` : `Компьютер победил!`);
            }, 0);

        } else if (!oneMore) {
            currentTurn = nextTurn(currentTurn);
        } else if (oneMore && currentTurn === 1) {
            setTimeout(() => {
                enemyTurn(enemyLevel);
            }, enemyLevel[1]);
        }
    }
}

// Генерирует случайную ориентацию: вертикальную, либо горизотальную
function getRandomOrientation() {
    let orientation = oneOfTwo();
    return orientation === 0 ? 'h' : 'v';
}

// Генерирует случайное число от 0 до 9
function oneOfTen() {
    return Math.floor(Math.random() * (10));
}

// Генерирует случайное число от 0 до 1
function oneOfTwo() {
    return Math.floor(Math.random() * (2));
}

$('.open-menu').append(
    `<svg viewBox="0 0 32 32" height="40px" width="40px"
        style="position: relative; left: calc(50% - 20px) ;top: calc(50% - 20px); fill: gray">
        <path d="M 4 7 L 4 9 L 28 9 L 28 7 Z M 4 15 L 4 17 L 28 17 L 28 15 Z M 4 23 L 4 25 L 28 25 L 28 23 Z "></path>
    </svg>`
);
$('.restart').append(
    `<svg viewBox="0 0 48 48" height="40px" width="40px"
        style="position: relative; left: calc(50% - 20px) ;top: calc(50% - 20px); fill: gray">
        <polygon points="24,12 16,6 24,0 "></polygon>
        <path d="M24,44C13,44,4,35,4,24c0-4.7,1.7-9.3,4.8-12.9l3,2.6C9.3,16.5,8,20.2,8,24c0,8.8,7.2,16,16,16
    s16-7.2,16-16S32.8,8,24,8h-3.2V4H24c11,0,20,9,20,20C44,35,35,44,24,44z"></path>
    </svg>`
);

//
// ОБРАБОТЧИКИ СОБЫТИЙ:
//

// Нажатие кнопки "Начать игру"
$('.start-game').click(function () {
    let playerName = $('.player-name').val();
    let aiLevel = parseInt($('select[name="ai-level"]').find(":selected").val());
    let aiTimeout = parseFloat($('.ai-timeout').val());
    console.log('playerName', playerName);
    console.log('aiLevel', aiLevel);
    console.log('aiTimeout', aiTimeout);
    if (playerName === '') {
        $('.player-name').addClass('required');
        setTimeout(() => {  $('.player-name').removeClass('required'); }, 300)
    } else {
        startGame(playerName, [aiLevel, aiTimeout]);
    }
});

// Контроль значений инпута внутри допустимых значений
$('input[type="number"]').change(function () {
    if (this.value > this.attributes.max.value) {
        this.value = this.attributes.max.value;
    } else if (this.value < this.attributes.min.value) {
        this.value = this.attributes.min.value
    }
});

$('.restart').mouseenter(function () {
    $('.restart').addClass('button-hover');
}).mouseleave(function () {
    $('.restart').removeClass('button-hover');
}).click(function () {
    startGame(playerName, enemyLevel);
    $('.mask').addClass('hidden');
    $('.result').addClass('hidden-top');
    $('.menu').addClass('hidden-top');
    setTimeout(() => {
        $('.mask').addClass('destroyed');
    }, 300);
});

$('.open-menu').mouseenter(function () {
    $('.open-menu').addClass('button-hover');
}).mouseleave(function () {
    $('.open-menu').removeClass('button-hover');
}).click(function () {
    $('.mask').removeClass('destroyed');
    setTimeout(() => {
        $('.mask').removeClass('hidden');
        $('.result').addClass('hidden-top');
        $('.menu').removeClass('hidden-top');
    }, 0);
});

$('.help').click(function () {
    $('.menu').addClass('hidden-top');
    $('.help-container').removeClass('hidden-top');
});

$('.help-close').click(function () {
    $('.menu').removeClass('hidden-top');
    $('.help-container').addClass('hidden-top');
});