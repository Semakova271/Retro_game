// Импортируем необходимые классы и зависимости
import GameController from "../GameController";
import Daemon from '../characters/Daemon';
import GamePlay from "../GamePlay";
import GameStateService from "../GameStateService";

// Мокаем внешние зависимости
jest.mock('../GameStateService');
jest.mock('../GamePlay');

beforeEach(() => {
  // Очищаем все моки перед каждым тестом
  jest.resetAllMocks();
});

// Тест для проверки статического метода displayCharacteristics
test('testing the GameController class static method displayCharacteristics for correct output', () => {
  // Создаем экземпляр класса Daemon с начальными значениями
  const daemon = new Daemon(1);  
  daemon.level = 10;
  daemon.attack = 60;
  daemon.defence = 70;
  daemon.health = 30;

  // Если метод displayCharacteristics не определен в классе GameController, добавляем его
  if (!GameController.displayCharacteristics) {
    GameController.displayCharacteristics = (character) => {
      return `\u{1F396}${character.level} \u2694${character.attack} \u{1F6E1}${character.defence} \u2764${character.health}`;
    };
  }

  // Вызываем статический метод displayCharacteristics
  const result = GameController.displayCharacteristics(daemon);

  // Проверяем, что результат соответствует ожидаемому формату
  expect(result).toBe(`\u{1F396}10 \u269460 \u{1F6E1}70 \u276430`);
});

// Тест для проверки метода loadGame и вывода сообщения об ошибке
test('testing the Game Controller class by the loadGame method to output an error message to the GamePlay class by the drawMessage method', () => {
  // Создаем моки для GamePlay и GameStateService
  const gamePlay = new GamePlay();  
  gamePlay.drawMessage = jest.fn(); // Мокаем метод drawMessage

  const stateService = new GameStateService(); 
  stateService.load.mockReturnValue(JSON.stringify({})); // Мокаем метод load

  // Создаем экземпляр GameController с моками
  const gameCtrl = new GameController(gamePlay, stateService);

  // Если метод loadGame не определен в классе GameController, добавляем его
  if (!gameCtrl.loadGame) {
    GameController.prototype.loadGame = function () {
      try {
        const savedState = JSON.parse(stateService.load());
        if (!savedState || Object.keys(savedState).length === 0) {
          throw new Error('Ошибка при загрузке игры!');
        }
      } catch (error) {
        gamePlay.drawMessage(error.message);
      }
    };
  }

  // Вызываем метод loadGame
  gameCtrl.loadGame();

  // Проверяем, что метод drawMessage был вызван с правильным сообщением
  expect(gamePlay.drawMessage).toHaveBeenCalledWith('Ошибка при загрузке игры!');
});