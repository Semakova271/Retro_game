import Character from '../Character'; 
import Bowman from '../characters/Bowman'; 
import Swordsman from '../characters/Swordsman'; 
import Magician from '../characters/Magician'; 

describe('Character and subclasses', () => {
  test('preventing the creation of Character objects', () => {
    expect(() => new Character(1, 'daemon')).toThrow(new Error('создайте конкретного персонажа')); // Проверяем выброс ошибки
  });

  test('should create Bowman with correct properties', () => {
    const bowman = new Bowman(1);
    expect(bowman.type).toBe('bowman');
    expect(bowman.attack).toBe(25);
    expect(bowman.defence).toBe(25);
  });

  test('should create Swordsman with correct properties', () => {
    const swordsman = new Swordsman(2);
    expect(swordsman.type).toBe('swordsman');
    expect(swordsman.attack).toBe(40);
    expect(swordsman.defence).toBe(10);
  });

  test('should create Magician with correct properties', () => {
    const magician = new Magician(3);
    expect(magician.type).toBe('magician');
    expect(magician.attack).toBe(10);
    expect(magician.defence).toBe(40);
  });
});


