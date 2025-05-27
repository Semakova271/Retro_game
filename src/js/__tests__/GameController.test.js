import GameController from "../GameController";
import Daemon from '../characters/Daemon';
import GamePlay from "../GamePlay";
import GameStateService from "../GameStateService";
jest.mock('../GameStateService');
jest.mock('../GamePlay');

beforeEach(() => {
  jest.resetAllMocks();
});

test('testing the GameController class static method displayCharacteristics for correct output', () => {
  const daemon = new Daemon(1);  
  daemon.level = 10;
  daemon.attack = 60;
  daemon.defence = 70;
  daemon.health = 30;
  const result = GameController.displayCharacteristics(daemon);
  expect(result).toBe(`\u{1F396}10 \u269460 \u{1F6E1}70 \u276430`);
});

test('testing the Game Controller class by the load Game method to output an error message to the GamePlay class by the drawMessage method', () => {
  const gamePlay = new GamePlay();  
  gamePlay.checkBinding.mockReturnValue();  
  const stateService = new GameStateService(); 
  stateService.load.mockReturnValue(JSON.stringify({}));
  const gameCtrl = new GameController(gamePlay, stateService);
  gameCtrl.loadGame();
  expect(gamePlay.drawMessage).toHaveBeenCalledWith('Ошибка при загрузке игры!');
});
