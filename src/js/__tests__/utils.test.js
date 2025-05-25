import { calcTileType } from '../utils';

describe('calcTileType', () => {
  const boardSize = 8;

  test('должен возвращать "top-left" для индекса 0', () => {
    expect(calcTileType(0, boardSize)).toBe('top-left');
  });

  test('должен возвращать "top-right" для индекса 7', () => {
    expect(calcTileType(7, boardSize)).toBe('top-right');
  });

  test('должен возвращать "bottom-left" для индекса 56', () => {
    expect(calcTileType(56, boardSize)).toBe('bottom-left');
  });

  test('должен возвращать "bottom-right" для индекса 63', () => {
    expect(calcTileType(63, boardSize)).toBe('bottom-right');
  });

  test('должен возвращать "top" для индекса 3', () => {
    expect(calcTileType(3, boardSize)).toBe('top');
  });

  test('должен возвращать "bottom" для индекса 60', () => {
    expect(calcTileType(60, boardSize)).toBe('bottom');
  });

  test('должен возвращать "left" для индекса 24', () => {
    expect(calcTileType(24, boardSize)).toBe('left');
  });

  test('должен возвращать "right" для индекса 31', () => {
    expect(calcTileType(31, boardSize)).toBe('right');
  });

  test('должен возвращать "center" для индекса 28', () => {
    expect(calcTileType(28, boardSize)).toBe('center');
  });
});