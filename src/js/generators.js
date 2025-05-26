/**
 * Формирует экземпляр персонажа из массива allowedTypes со
 * случайным уровнем от 1 до maxLevel
 *
 * @param allowedTypes массив классов
 * @param maxLevel максимальный возможный уровень персонажа
 * @returns генератор, который при каждом вызове
 * возвращает новый экземпляр класса персонажа
 *
 */

import Team from './Team';

export function* characterGenerator(allowedTypes, maxLevel) {
  while (true) {
    const Type = allowedTypes[Math.floor(Math.random() * allowedTypes.length)]; // Выбираем случайный тип
    const level = Math.floor(Math.random() * maxLevel) + 1; // Генерируем уровень от 1 до maxLevel
    yield new Type(level); // Создаем и возвращаем экземпляр персонажа
}
}

/**
 * Формирует массив персонажей на основе characterGenerator
 * @param allowedTypes массив классов
 * @param maxLevel максимальный возможный уровень персонажа
 * @param characterCount количество персонажей, которое нужно сформировать
 * @returns экземпляр Team, хранящий экземпляры персонажей. Количество персонажей в команде - characterCount
 * */
export function generateTeam(allowedTypes, maxLevel, characterCount) {
  const team = new Team(); // Создаем новую команду
  const generator = characterGenerator(allowedTypes, maxLevel); // Создаем генератор

  for (let i = 0; i < characterCount; i++) {
    const character = generator.next().value; // Получаем следующего персонажа
    team.add(character); // Добавляем его в команду
  }

  return team; // Возвращаем готовую команду
}
