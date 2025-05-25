import themes from "./themes";
import { calcHealthLevel, calcTileType } from './utils'; 
import { characterGenerator, generateTeam } from './generators'; 
import GamePlay from "./GamePlay";
import cursors from "./cursors";

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.gameState = new GameState();

    this.gamePlay.addNewGameListener(this.onNewGameClick.bind(this));
    this.gamePlay.addSaveGameListener(this.onSaveGameClick.bind(this));
    this.gamePlay.addLoadGameListener(this.onLoadGameClick.bind(this));
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
  }

  init() {
    // TODO: add event listeners to gamePlay events
    // TODO: load saved stated from stateService
    const characterCount = Math.min(this.gameState.gameLevel + 2, 6);
    this.gamePlay.drawUi( themes.setTheme(this.gameState.gameLevel) );

    this.gameState.initTeams(characterCount);

    this.gamePlay.redrawPositions(this.gameState.allCharacters);
  }

  gameLevelUp() {
    GamePlay.showMessage('Уровень пройден!');
    this.gameState.gameLevel += 1;
    this.gameState.turn = 0;
    this.gameState.unsetActiveCharacter();
    this.gamePlay.deselectAllCells();
    this.init();
  }

  gameOver() {
    GamePlay.showError('Вы проиграли!');
    this.gamePlay.cellClickListeners = [];
    this.gamePlay.cellEnterListeners = [];
    this.gamePlay.cellLeaveListeners = [];
  }

  onCellClick(index) {
    console.log('onCellClick\nturn: ', this.gameState.turn);
    console.table(this.gameState.currentGameState);
    if ( !this.gameState.isPlayerTurn() ) {
      GamePlay.showError('Сейчас ход противника!');
      return;
    }
    const targetCharacter = this.gameState.allCharacters
        .find(member => member.position === index);

    if (targetCharacter) {
      if ( this.gameState.isActiveCharacter() ) {
        // если уже выбран активный игрок
        if ( this.gameState.isOpponentCharacter(targetCharacter) ) {
          // и навели курсор на персонажа противника
          if ( this.gameState.activeCharacter.character.attackDistance >= calculateDistance(this.gameState.activeCharacter.position, index) ) {
            // если дистанция позволяет поразить противника - атакуем
            const damage = this.gameState.calculateDamage(targetCharacter);
            this.gamePlay.showDamage(index, damage)
              .then(() => this.causeDamage(targetCharacter, damage))
              .then(() => this.redrawBoard())
              .then(() => this.gameState.checkWinOrLoose())
              .then(() => this.gameState.chooseOpponentTurn())
              .then(result => this.selectOpponentCharacter(result))
              .then(result => Promise.any([
                this.opponentMoves(result),
                this.opponentAttacks(result),
              ]))
              .then(() => this.gameState.checkWinOrLoose())
              .catch(result => {
                console.log('caught result: ', result);
                if (result.gameOver) {
                  setTimeout(() => this.gameOver(), 0);
                }
                if (result.nextLevel) {
                  setTimeout(() => this.gameLevelUp(), 0);
                }
              });
          } else {
            // противник дальше, чем радиус поражения - сообщение об ошибке
            GamePlay.showError('Дистанция атаки превышает возможности персонажа!');
          }
        } else {
          if ( this.gameState.activeCharacter !== targetCharacter ) {
            // если курсор на другом персонаже своей команды - выбираем другого активного персонажа
            this.gamePlay.deselectCell( this.gameState.activeCharacter.position );
            this.gamePlay.selectCell(index);
            this.gameState.setActiveCharacter(targetCharacter);
          }
        }
      } else {
        // если нет активного игрока и навели курсор на персонажа свой команды - выбираем активного игрока
        if ( !this.gameState.isOpponentCharacter(targetCharacter) ) {
          this.gamePlay.selectCell(index);
          this.gameState.setActiveCharacter(targetCharacter);
        } else {
          GamePlay.showError('Выберите персонажа из своей команды, который будет ходить!');
        }
      }
    } else {
      if ( !this.gameState.isActiveCharacter() ) return; // если нет активного игрока и кликнули на пустое поле - ничего не делать
      // проверяем возможность перемещения на указанную клетку
      if (this.gameState.activeCharacter.character.move >= calculateDistance(this.gameState.activeCharacter.position, index)) {
        // если можем перейти на эту клетку - перемещаем персонажа и перерисовываем игровое поле
        this.gamePlay.deselectCell(this.gameState.activeCharacter.position);
        this.gameState.activeCharacter.position = index;
        this.gamePlay.redrawPositions(this.gameState.allCharacters);
        this.gamePlay.selectCell(index);
        // передаём ход противнику
        this.gameState.passTheTurn();
        this.gameState.chooseOpponentTurn()
          .then(result => this.selectOpponentCharacter(result))
          .then(result => Promise.any([
            this.opponentMoves(result),
            this.opponentAttacks(result),
          ]))
          .then(() => this.gameState.checkWinOrLoose())
          .catch(result => {
            console.log('caught result: ', result);
            if (result.gameOver) {
              setTimeout(() => this.gameOver(), 0);
            }
            if (result.nextLevel) {
              setTimeout(() => this.gameLevelUp(), 0);
            }
          });
      } else {
        // иначе действие невозможно - сообщение об ошибке
        GamePlay.showError('Персонаж не может переместиться так далеко!');
      }
    }
  }

  redrawBoard() {
    this.gamePlay.redrawPositions(this.gameState.allCharacters);
  }

  selectOpponentCharacter(result) {
    return new Promise((resolve) => {
      this.gamePlay.selectOpponentCell(result.currentIndex);
      setTimeout(() => {
        this.gamePlay.deselectOpponentCell(result.currentIndex);
        resolve(result);
      }, 1000);

    });
  }

  causeDamage(targetCharacter, damage) {
    targetCharacter.character.health -= damage;
    if (targetCharacter.character.health <= 0) {
      // атакуемый персонаж погиб
      this.gamePlay.deselectCell(targetCharacter.position);
      this.gameState.positionedOpponentTeam = this.gameState.positionedOpponentTeam.filter(character => character !== targetCharacter);
      this.gameState.positionedPlayerTeam = this.gameState.positionedPlayerTeam.filter(character => character !== targetCharacter);
      if (targetCharacter === this.gameState.activeCharacter) {
        this.gameState.unsetActiveCharacter();
        this.gamePlay.deselectAllCells();
      }
    }
  }

  opponentMoves(result) {
    return new Promise((resolve, reject) => {
      console.log('Inside opponentMoves: ', result);
      if (result.move) {
        result.characterToMove.position = result.newIndex;
        setTimeout(() => {
          this.redrawBoard();
          this.gamePlay.selectCell(result.newIndex, 'purple');
          setTimeout(() => {
            this.gamePlay.deselectCell(result.newIndex);
            resolve('Move is finished');
          }, 1000);
        }, 1000);
      } else {
        reject("Character mustn't move");
      }
    });
  }

  opponentAttacks(result) {
    return new Promise((resolve, reject) => {
      console.log('Inside opponentAttacks: ', result);
      if (result.attack) {
        this.gamePlay.showDamage(result.target.position, result.damage)
          .then(() => this.causeDamage(result.target, result.damage))
          .then(() => {
            this.redrawBoard();
            resolve('Attack is finished');
          })
          .catch(console.error);
      } else {
        reject("Character mustn't attack");
      }
    });
  }

  onCellEnter(index) {
    const positionedCharacter = this.gameState.allCharacters
        .find(member => member.position === index);

    if (positionedCharacter) {
      // в любом случае показываем всплывающую подсказку об игроке
      this.gamePlay.showCellTooltip( getCharacterTooltip(positionedCharacter.character) , index );
      if ( this.gameState.isActiveCharacter() ) {
        // если уже выбран активный игрок
        if ( this.gameState.isOpponentCharacter(positionedCharacter) ) {
          // и навели курсор на персонажа противника
          if ( this.gameState.activeCharacter.character.attackDistance >= calculateDistance(this.gameState.activeCharacter.position, index) ) {
            // если дистанция позволяет поразить противника - курсор прицел и подсвечиваем поле красным
            this.gamePlay.selectCell(index, 'red');
            this.gamePlay.setCursor(cursors.crosshair);
          } else {
            // противник дальше, чем радиус поражения - курсор запрещено
            this.gamePlay.setCursor(cursors.notallowed);
          }
        } else {
          if ( this.gameState.activeCharacter !== positionedCharacter ) {
            // если курсор на другом персонаже своей команды - курсор указатель
            this.gamePlay.setCursor(cursors.pointer);
          }
        }
      } else {
        // если нет активного игрока и навели курсор на персонажа свой команды - курсор указатель
        if ( !this.gameState.isOpponentCharacter(positionedCharacter) ) {
          this.gamePlay.setCursor(cursors.pointer);
        }
      }
    } else {
      if ( !this.gameState.isActiveCharacter() ) return; // если нет активного игрока и навели на пустое поле - ничего не делать
      // проверяем возможность перемещения на указанную клетку
      if (this.gameState.activeCharacter.character.move >= calculateDistance(this.gameState.activeCharacter.position, index)) {
        // если можем перейти на эту клетку - курсор указатель и подсвечиваем поле зелёным
        this.gamePlay.selectCell(index, 'green');
        this.gamePlay.setCursor(cursors.pointer);
      } else {
        // иначе действие невозможно - курсор notallowed
        this.gamePlay.setCursor(cursors.notallowed);
      }
    }
  }

  onCellLeave(index) {
    if ( this.gameState.isActiveCharacter() && index !== this.gameState.activeCharacter.position ) {
      this.gamePlay.deselectCell(index);
    }
    this.gamePlay.hideCellTooltip(index);
    this.gamePlay.setCursor(cursors.auto);
  }

  onNewGameClick() {
    this.gameState = new GameState();
    this.init();
  }

  onSaveGameClick() {
    if ( !this.gameState.isPlayerTurn() ) {
      GamePlay.showError('Дождитесь окончания хода противника, чтобы сохранить игру!');
      return;
    }
    this.stateService.save( GameState.from(this.gameState) );
    GamePlay.showMessage('The game saved');
  }

  onLoadGameClick() {
    try {
      const restoredGame = this.stateService.load();
      console.log(restoredGame);
      if (restoredGame === null) {
        throw new Error('Нет сохранённых игр');
      }
      this.gameState = new GameState(
        restoredGame.gameLevel,
        restoredGame.turn,
        restoreTeam(restoredGame.positionedPlayerTeam),
        restoreTeam(restoredGame.positionedOpponentTeam),
        restoredGame.activeCharacter,
      );
      this.gamePlay.drawUi( themes.setTheme(this.gameState.gameLevel) );
      this.gamePlay.redrawPositions(this.gameState.allCharacters);

      if (this.gameState.activeCharacter) {
        this.gamePlay.selectCell(this.gameState.activeCharacter.position);
      }
    } catch (e) {
      console.error(e);
      GamePlay.showError('Не удалось загрузить игру!');
    }
  }
}