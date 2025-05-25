import { generateTeam } from '../generators'; 
import Bowman from '../characters/Bowman'; 
import Swordsman from '../characters/Swordsman'; 
import Magician from '../characters/Magician'; 

describe('characterGenerator and generateTeam', () => {
  test('generateTeam should generate correct number of characters', () => {
    const allowedTypes = [Bowman, Swordsman, Magician]; // Разрешенные типы персонажей
    const maxLevel = 3; // Максимальный уровень персонажей
    const characterCount = 5; // Количество персонажей в команде

    const team = generateTeam(allowedTypes, maxLevel, characterCount); // Генерация команды
    expect(team.toArray().length).toBe(characterCount); // Проверка, что команда содержит правильное количество персонажей
  });
});
