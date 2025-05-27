import themes from "./themes";
import { generateTeam } from "./generators";
import PositionedCharacter from "./PositionedCharacter";
import GameState from "./GameState";
import Bowman from "./characters/Bowman";
import Swordsman from "./characters/Swordsman";
import Magician from "./characters/Magician";
import Daemon from "./characters/Daemon";
import Undead from "./characters/Undead";
import Vampire from "./characters/Vampire";


export default class GameController {
  static charactersPlayer = [Bowman, Swordsman, Magician];
  static charactersOpponent = [Daemon, Undead, Vampire];  
  static characterTypes = {
    bowman: Bowman,
    swordsman: Swordsman,
    magician: Magician,
    daemon: Daemon,
    undead: Undead,
    vampire: Vampire,
    }

  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.characterCount = 3;
    this.currentLevel;    
    this.dataCharacterByPosition = new Map();
    this.selectedCharacter = undefined;
    this.highlightedCells = [];
    this.moveCursor = undefined;
    this.playerTurn;
    this.blocking;
    this.points = 0;
  }

  init() {
    this.gameOrder('start');
    this.subscribeEvents();
  }

  subscribeEvents() {
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));    
    this.gamePlay.addNewGameListener(this.onNewGame.bind(this)); 
    this.gamePlay.addSaveGameListener(this.onSaveGame.bind(this)); 
    this.gamePlay.addLoadGameListener(this.onLoadGame.bind(this)); 
  }

  static choiceTheme(level) {
    switch ((level - 1) % 4 + 1) {
      case 1:
        return themes.prairie;
      case 2:
        return themes.desert;
      case 3:
        return themes.arctic;
      case 4:
        return themes.mountain;
    }
  }

  positionFormation(team, flagTeamPlayer) {
    team.characters.forEach(character => {
      const placementColumns = Math.round(this.gamePlay.boardSize / 4);
      let position = 0;      
      do {
        const row = GameController.getRandomInRage(0, this.gamePlay.boardSize - 1);
        const col = GameController.getRandomInRage(0, placementColumns - 1);
        position = row * this.gamePlay.boardSize + col;
        if (!flagTeamPlayer) {
          position += this.gamePlay.boardSize - placementColumns;
        }
      } while (this.dataCharacterByPosition.has(position));
      this.dataCharacterByPosition.set(position, { positionedCharacter: new PositionedCharacter(character, position), flagTeamPlayer: flagTeamPlayer});
    });
  }    

  static displayCharacteristics(character) {
    return `\u{1F396}${character.level} \u2694${character.attack} \u{1F6E1}${character.defence} \u2764${character.health}`;
  }

  static getRandomInRage(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  coordinatesPosition(position) {
    const row = Math.floor(position / this.gamePlay.boardSize);
    const col = position % this.gamePlay.boardSize;
    return {
      row,
      col,
    }
  }

  shiftDifference(position, index) {
    const placeCurrent = this.coordinatesPosition(position);
    const placeIndex = this.coordinatesPosition(index);
    const differenceRow = Math.abs(placeCurrent.row - placeIndex.row);
    const differenceCol = Math.abs(placeCurrent.col - placeIndex.col);
    const difference = Math.abs(differenceRow - differenceCol);
    return {
      differenceRow,
      differenceCol,
      difference,
    }
  }

  permissibleAttack(index) {
    const attackRadius = this.selectedCharacter.character.attackRadius;
    const shift = this.shiftDifference(this.selectedCharacter.position, index, this.gamePlay.boardSize);
    if (!shift.differenceRow && !shift.differenceCol) {
      return false;
    }
    if (shift.differenceCol <= attackRadius && shift.differenceRow <= attackRadius) {
      return true;
    }
    return false;
  }

  permissibleMovement(index) {
    const numberSteps = this.selectedCharacter.character.numberSteps;
    const shift = this.shiftDifference(this.selectedCharacter.position, index, this.gamePlay.boardSize);
    if (!shift.differenceRow && !shift.differenceCol) {
      return false;
    }
    if ((!shift.differenceRow && shift.differenceCol <= numberSteps) ||
        (!shift.differenceCol && shift.differenceRow <= numberSteps) ||
        (!shift.difference && shift.differenceRow <= numberSteps)) {
      return true;
    }
    return false;
  }

  teamComposition(flagTeam) {
    const team = {
      characters: [],
    }
    for (const { positionedCharacter, flagTeamPlayer } of this.dataCharacterByPosition.values()) {
      if (flagTeamPlayer === flagTeam) {
        team.characters.push(positionedCharacter.character);
      }     
    }
    return team;
  }

  redrawingLevel() {
    this.gamePlay.drawUi(GameController.choiceTheme(this.currentLevel));
    this.gamePlay.redrawPositions([...this.dataCharacterByPosition.values()]);
    this.gamePlay.drawLevel(this.currentLevel);
  }

  startGame() {
    this.playerTurn = true;
    this.currentLevel = 1;
    this.dataCharacterByPosition = new Map();
    this.selectedCharacter = undefined;    
    const teamPlayer = generateTeam(GameController.charactersPlayer, this.currentLevel, this.characterCount);
    this.positionFormation(teamPlayer, true);
    const teamOpponent = generateTeam(GameController.charactersOpponent, this.currentLevel, this.characterCount);
    this.positionFormation(teamOpponent, false);
    this.redrawingLevel();
  }

  movingNextLevel() {
    this.currentLevel += 1;
    const teamPlayerOld = this.teamComposition(true);
    for (const character of teamPlayerOld.characters) {
      character.levelUp();
    }
    const teamPlayer = generateTeam(GameController.charactersPlayer, this.currentLevel, this.characterCount - teamPlayerOld.characters.length);
    teamPlayer.characters.push(...teamPlayerOld.characters);
    this.playerTurn = true;      
    this.dataCharacterByPosition.clear();
    this.selectedCharacter = undefined;   
    this.positionFormation(teamPlayer, true);
    const teamOpponent = generateTeam(GameController.charactersOpponent, this.currentLevel, this.characterCount);
    this.positionFormation(teamOpponent, false);
    this.redrawingLevel();
  }

  loadGame() {
    try {
      const loadState = this.stateService.load();
      GameState.from(loadState);
      this.currentLevel = GameState.stateGame.currentLevel;
      this.playerTurn = GameState.stateGame.playerTurn;
      this.points = GameState.stateGame.points; 
      this.selectedCharacter = undefined; 
      this.gamePlay.boardSize = GameState.stateGame.boardSize;;
      this.characterCount = GameState.stateGame.characterCount;;
      this.dataCharacterByPosition = new Map();    
      const dataCharacterByList = GameState.stateGame.dataCharacterByPosition;
      for (const [ position, { flagTeamPlayer, positionedCharacter } ] of dataCharacterByList) {
        const characterObj = positionedCharacter.character;
        const character = new GameController.characterTypes[characterObj.type](1);
        character.level = characterObj.level;
        character.attack = characterObj.attack;
        character.defence = characterObj.defence;
        character.health = characterObj.health;
        this.dataCharacterByPosition.set(position, { positionedCharacter: new PositionedCharacter(character, position), flagTeamPlayer: flagTeamPlayer});
      }
      this.redrawingLevel();
      this.gamePlay.drawMessage('Игра загружена!', 'message-info');
    } catch(e) {
      this.gamePlay.drawMessage('Ошибка при загрузке игры!');
    }      
  }

  changeCursor(index = -1, color = '', type = '') {    
    if (this.moveCursor >= 0) {     
      if (!this.selectedCharacter || this.moveCursor != this.selectedCharacter.position) {
        this.gamePlay.deselectCell(this.moveCursor);
        this.gamePlay.setCursor('default');
        this.moveCursor = undefined;
      }   
    }
    if (index >= 0) {
      if (color != '') {
        this.gamePlay.selectCell(index, color);
      }
      this.moveCursor = index;
    }
    if (type != '') {
      this.gamePlay.setCursor(type);
    }
  }

  gameOrder(command = 'turn') {    
    this.highlightOff();  
    this.changeCursor();    
    if (command === 'start') {
      this.startGame();
      this.gamePlay.drawMessage('Новая игра!', 'message-info');
    }
    if (command === 'load') {
      this.loadGame();
    }
    if (this.teamComposition(true).characters.length === 0) {      
      this.startGame();
      this.gamePlay.drawMessage('Поражение!', 'message-bad');
      command = '';  
    }  
    if (this.teamComposition(false).characters.length === 0) {      
      this.movingNextLevel();
      this.gamePlay.drawMessage('Победа!', 'message-good');
      command = '';  
    }         
    if (command === 'turn') { 
      this.playerTurn = !this.playerTurn;      
    }
    this.blocking = !this.playerTurn; 
    if (!this.playerTurn) {      
      this.responseOpponent();
    } else {
      this.highlightMoves();
      this.highlightAttack();
    }
    this.gamePlay.drawPoints(this.points);    
    GameState.from({
      currentLevel: this.currentLevel,
      dataCharacterByPosition: [...this.dataCharacterByPosition.entries()],
      playerTurn: this.playerTurn,
      points: this.points,
      boardSize: this.gamePlay.boardSize,
      characterCount: this.characterCount,
    });    
  }  

  static damageCalculation(attack, defence) {
    return Math.max(attack - defence, Math.round(attack) / 10)
  }

  characterMove(positionedCharacter, newPosition, flagTeamPlayer) {
    const currentPosition = positionedCharacter.position;
    positionedCharacter.position = newPosition;    
    this.dataCharacterByPosition.delete(currentPosition);    
    this.dataCharacterByPosition.set(newPosition, { positionedCharacter: positionedCharacter, flagTeamPlayer: flagTeamPlayer });    
    this.gamePlay.redrawPositions([...this.dataCharacterByPosition.values()]);
    if (flagTeamPlayer) {
      this.gamePlay.selectCell(newPosition);
      this.gamePlay.deselectCell(currentPosition); 
      this.gamePlay.setCursor('default');
    }
  }

  characterAttack(attacker, position, flagTeamPlayer) {
    return new Promise(resolve => {
      const dataCharacterTarget = this.dataCharacterByPosition.get(position);
      const target = dataCharacterTarget.positionedCharacter;
      const damage = GameController.damageCalculation(attacker.character.attack, target.character.defence);
      this.gamePlay.showDamage(position, damage).then(() => {        
        target.character.health = Math.round((target.character.health - damage) * 10) / 10;
        if (target.character.health <= 0) {
          this.dataCharacterByPosition.delete(position);          
          if (!flagTeamPlayer) {
            if (this.selectedCharacter === target) {
              this.gamePlay.deselectCell(position);
              this.selectedCharacter = undefined;
            } 
          }
        } else {
          this.dataCharacterByPosition.set(position, dataCharacterTarget);
        }        
        this.gamePlay.redrawPositions([...this.dataCharacterByPosition.values()]);
        if (flagTeamPlayer) {
          this.points += damage * 10;
          this.gamePlay.deselectCell(position);
          this.gamePlay.setCursor('default');
        }         
        resolve();
      });
    }); 
  }

  positionByCoordinates(row, col) {
    return row * this.gamePlay.boardSize + col;
  }

  positionBySteps(currentRow, currentCol, stepsRow, stepsCol) {
    const newRow = currentRow + stepsRow;
    const newCol = currentCol + stepsCol;
    return this.positionByCoordinates(newRow, newCol);
  }

  cellUnderAttackPlayer(listPlayersInGame, listOpponentsInGame, opponent, stepsRow = 0, stepsCol = 0) {
    const damagesList = [0];
    for (const opponentItem of listOpponentsInGame) {
      for (const playerItem of listPlayersInGame) {
        const shiftRow = playerItem.row - opponentItem.row;
        const shiftCol = playerItem.col - opponentItem.col;
        let recRow = Math.abs(shiftRow);
        let recCol = Math.abs(shiftCol);
        if (opponent === opponentItem) {
          recRow = Math.abs(shiftRow - stepsRow);
          recCol = Math.abs(shiftCol - stepsCol);
        }        
        const radius = recRow > recCol ? recRow : recCol;
        const attacker = playerItem.positionedCharacter.character;
        const target = opponentItem.positionedCharacter.character;
        if (radius <= attacker.attackRadius) {
          const damage = GameController.damageCalculation(attacker.attack, target.defence);
          damagesList.push(damage);
        }
      }
    }
    return Math.max(...damagesList);
  }

  cellUnderAttackOpponent(listPlayersInGame, listOpponentsInGame, opponent, stepsRow = 0, stepsCol = 0) {
    const damagesList = [0];
    for (const opponentItem of listOpponentsInGame) {
      for (const playerItem of listPlayersInGame) {
        const shiftRow = playerItem.row - opponentItem.row;
        const shiftCol = playerItem.col - opponentItem.col;
        let recRow = Math.abs(shiftRow);
        let recCol = Math.abs(shiftCol);
        if (opponent === opponentItem) {
          recRow = Math.abs(shiftRow - stepsRow);
          recCol = Math.abs(shiftCol - stepsCol);
        }    
        const radius = recRow > recCol ? recRow : recCol;
        const attacker = opponentItem.positionedCharacter.character;
        const target = playerItem.positionedCharacter.character;
        if (radius <= attacker.attackRadius) {
          const damage = GameController.damageCalculation(attacker.attack, target.defence);
          damagesList.push(damage);
        }
      }
    }
    return Math.max(...damagesList);
  }

  static listFiltering(list, typeFieldList) {
    let newList = list;
    for (const typeField of typeFieldList) {
      if (typeField != undefined) {
        if (typeField.type === 'max') {
          const selectedFilter = newList.reduce((accumulator, el) => Math.max(accumulator, el[typeField.value]), -Infinity);
          newList = newList.filter((el) => el[typeField.value] === selectedFilter);
        }
        if (typeField.type === 'min') {
          const selectedFilter = newList.reduce((accumulator, el) => Math.min(accumulator, el[typeField.value]), Infinity);
          newList = newList.filter((el) => el[typeField.value] === selectedFilter);
        }
      }
    }
    return newList;
  }

  possibleMoves(opponent, player, listOpponentsInGame, listPlayersInGame) {
    const opponentCharacter = opponent.positionedCharacter.character;
    const playerCharacter = player.positionedCharacter.character;
    const numberSteps = opponentCharacter.numberSteps;
    const shiftRow = player.row - opponent.row;
    const shiftCol = player.col - opponent.col;
    const stepsRowCol = [];  
    for (let row = -numberSteps; row <= numberSteps; row++) {
      if (opponent.row + row < 0 || opponent.row + row > this.gamePlay.boardSize - 1) {
        continue;
      }
      for (let col = -numberSteps; col <= numberSteps; col++) {
        if (opponent.col + col < 0 || opponent.col + col > this.gamePlay.boardSize - 1) {
          continue;
        }
        if (this.dataCharacterByPosition.has(this.positionBySteps(opponent.row, opponent.col, row, col))) {
          continue;
        }
        if (Math.abs(row) === Math.abs(col) || row === 0 || col === 0) {
          const recRow = Math.abs(shiftRow - row);
          const recCol = Math.abs(shiftCol - col);
          const radius = recRow > recCol ? recRow : recCol;
          const opponentDamage = this.cellUnderAttackOpponent(listPlayersInGame, listOpponentsInGame, opponent, row, col);
          const playerDamage = this.cellUnderAttackPlayer(listPlayersInGame, listOpponentsInGame, opponent, row, col);
          const relevance = opponentDamage - playerDamage;
          const actionPosition = this.positionBySteps(opponent.row, opponent.col, row, col);
          stepsRowCol.push({
            opponent: opponent,
            typeAction: 2,
            actionPosition: actionPosition,
            stepsRow: row,
            stepsCol: col,
            relevance: relevance,
            healthPlayer: playerCharacter.health,  
            radius: radius,                       
          });
        }
      }
    } 
    return stepsRowCol;
  }

  possibleAttack(opponent, player, listOpponentsInGame, listPlayersInGame, stepsRowCol) {
    const opponentCharacter = opponent.positionedCharacter.character;
    const playerCharacter = player.positionedCharacter.character;
    const attackRadius = opponentCharacter.attackRadius; 
    const shiftRow = player.row - opponent.row;
    const shiftCol = player.col - opponent.col;
    const recRow = Math.abs(shiftRow);
    const recCol = Math.abs(shiftCol);
    const radius = recRow > recCol ? recRow : recCol;
    const opponentDamage = this.cellUnderAttackOpponent(listPlayersInGame, listOpponentsInGame, opponent);
    const playerDamage = this.cellUnderAttackPlayer(listPlayersInGame, listOpponentsInGame, opponent);
    const currentDamage = GameController.damageCalculation(opponentCharacter.attack, playerCharacter.defence);
    const relevance = opponentDamage + currentDamage - playerDamage;
    const actionPosition = player.positionedCharacter.position;
    const possibilities = { 
      opponent: opponent, 
      typeAction: 1,
      actionPosition: actionPosition,         
      stepsRow: 0,
      stepsCol: 0,
      relevance: relevance, 
      healthPlayer: playerCharacter.health,   
      radius: 0,              
    }
    if (radius <= attackRadius) {
      stepsRowCol.push(possibilities);
    }
  }
  
  responseOpponent() {
    const listPlayersInGame = [];
    const listOpponentsInGame = [];
    for (const dataCharacter of this.dataCharacterByPosition.values()) {
      if (dataCharacter.flagTeamPlayer) {
        listPlayersInGame.push({ ...dataCharacter, ...this.coordinatesPosition(dataCharacter.positionedCharacter.position) });
      } else {
        listOpponentsInGame.push({ ...dataCharacter, ...this.coordinatesPosition(dataCharacter.positionedCharacter.position) });
      }     
    }
    const possibleActionsAll = []; 
    for (const opponent of listOpponentsInGame) {
      for (const player of listPlayersInGame) {
        const possibleActions = this.possibleMoves(opponent, player, listOpponentsInGame, listPlayersInGame);
        this.possibleAttack(opponent, player, listOpponentsInGame, listPlayersInGame, possibleActions);
        const filteredActions = GameController.listFiltering(possibleActions, [{type: 'max', value: 'relevance'}, {type: 'min', value: 'radius'}]);        
        const selectedAction = filteredActions[GameController.getRandomInRage(0, filteredActions.length - 1)];        
        possibleActionsAll.push(selectedAction);
      }
    }
    const filteredActionsAll = GameController.listFiltering(possibleActionsAll, [{type: 'max', value: 'relevance'}, {type: 'min', value: 'healthPlayer'}]);
    const action = filteredActionsAll[GameController.getRandomInRage(0, filteredActionsAll.length - 1)];
    if (action.typeAction === 1) {
      this.characterAttack(action.opponent.positionedCharacter, action.actionPosition, false).then(() => {
        this.gameOrder();
      });
    } else if (action.typeAction === 2) {
      this.characterMove(action.opponent.positionedCharacter, action.actionPosition, false);
      this.gameOrder();
    }  
  }

  highlightMoves() {
    if (this.selectedCharacter) {
      const playerCharacter = this.selectedCharacter.character;  
      const coordinates = this.coordinatesPosition(this.selectedCharacter.position);
      const numberSteps = playerCharacter.numberSteps;
      for (let row = -numberSteps; row <= numberSteps; row++) {
        if (coordinates.row + row < 0 || coordinates.row + row > this.gamePlay.boardSize - 1) {
          continue;
        }
        for (let col = -numberSteps; col <= numberSteps; col++) {
          if (coordinates.col + col < 0 || coordinates.col + col > this.gamePlay.boardSize - 1) {
            continue;
          }
          if (this.dataCharacterByPosition.has(this.positionBySteps(coordinates.row, coordinates.col, row, col))) {
            continue;
          }
          if (Math.abs(row) === Math.abs(col) || row === 0 || col === 0) {
            const actionPosition = this.positionBySteps(coordinates.row, coordinates.col, row, col);
            this.gamePlay.highlightCell(actionPosition);
            this.highlightedCells.push(actionPosition);
          }
        }
      } 
    }
  }

  highlightAttack() {
    if (this.selectedCharacter) {
      const playerCharacter = this.selectedCharacter.character;  
      const coordinates = this.coordinatesPosition(this.selectedCharacter.position);
      const attackRadius = playerCharacter.attackRadius; 
      for (const dataCharacter of this.dataCharacterByPosition.values()) {
        if (!dataCharacter.flagTeamPlayer) {
          const opponentCoordinates = this.coordinatesPosition(dataCharacter.positionedCharacter.position);
          const shiftRow = opponentCoordinates.row - coordinates.row;
          const shiftCol = opponentCoordinates.col - coordinates.col;
          const recRow = Math.abs(shiftRow);
          const recCol = Math.abs(shiftCol);
          const radius = recRow > recCol ? recRow : recCol;
          if (radius <= attackRadius) {
            const actionPosition = dataCharacter.positionedCharacter.position;
            this.gamePlay.highlightCell(actionPosition, 'red');
            this.highlightedCells.push(actionPosition);
          }
        }     
      }
    }
  }

  highlightOff() {
    for (const elementIndex of this.highlightedCells) {
      this.gamePlay.backlight(elementIndex);
    }
    this.highlightedCells = [];
  }

  actionsPlayer(index, callInfo, turnOffSelection, callSelection, callAttack, callMove, callIllegal) { 
    if (this.blocking) {
      return;
    }
    if (this.dataCharacterByPosition.has(index)) {
      callInfo();
      const dataCharacter = this.dataCharacterByPosition.get(index);
      const positionedCharacter = dataCharacter.positionedCharacter;
      if (dataCharacter && dataCharacter.flagTeamPlayer) {
        if (positionedCharacter === this.selectedCharacter) {
          turnOffSelection();
          return;
        } else {
          callSelection();
          return;
        }
      }
    }
    if (this.selectedCharacter) {
      if (this.dataCharacterByPosition.has(index)) {
        const dataCharacter = this.dataCharacterByPosition.get(index);
        if (dataCharacter && !dataCharacter.flagTeamPlayer && this.permissibleAttack(index)) {
          callAttack();
          return;
        }
      } else if (this.permissibleMovement(index)) {
        callMove();
        return;
      }
      callIllegal();
    }
  }

  onCellClick(index) {
    this.actionsPlayer(index, () => {}, () => {
      this.highlightOff();
      this.gamePlay.deselectCell(this.selectedCharacter.position);
      this.selectedCharacter = undefined;      
    }, () => {
      this.highlightOff();
      if (this.selectedCharacter) {
        this.gamePlay.deselectCell(this.selectedCharacter.position);
      }
      this.selectedCharacter = this.dataCharacterByPosition.get(index).positionedCharacter;
      this.gamePlay.selectCell(index);
      this.highlightMoves();
      this.highlightAttack();
    }, () => {
      this.characterAttack(this.selectedCharacter, index, true).then(() => {          
        this.gameOrder();      
      });      
    }, () => {  
      this.characterMove(this.selectedCharacter, index, true);            
      this.gameOrder();
    }, () => {}); 
  }  

  onCellEnter(index) {
    this.actionsPlayer(index, () => {
      const character = this.dataCharacterByPosition.get(index).positionedCharacter.character;
      this.gamePlay.showCellTooltip(GameController.displayCharacteristics(character), index);
    }, () => {
      this.gamePlay.setCursor('pointer');
    }, () => {
      this.gamePlay.setCursor('pointer');
    }, () => {
      this.changeCursor(index, 'red', 'crosshair');
    }, () => {
      this.changeCursor(index, 'green', 'pointer');
    }, () => {
      this.gamePlay.setCursor('not-allowed');
    }); 
  }

  onCellLeave(index) {
    this.actionsPlayer(index, () => {
      this.gamePlay.hideCellTooltip(index);
    }, () => {
      this.gamePlay.setCursor('default');
    }, () => {
      this.gamePlay.setCursor('default');
    }, () => {
      this.changeCursor();
    }, () => {
      this.changeCursor();
    }, () => {
      this.gamePlay.setCursor('default');
    });     
  }

  onNewGame() {
    this.gameOrder('start');    
  }

  onSaveGame() {
    this.stateService.save(GameState.stateGame);
    this.gamePlay.drawMessage('Игра сохранена!', 'message-info');
  }
  
  onLoadGame() {
    this.gameOrder('load');
  }
}
