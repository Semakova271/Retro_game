/**
 * @todo
 * @param index - индекс поля
 * @param boardSize - размер квадратного поля (в длину или ширину)
 * @returns строка - тип ячейки на поле:
 *
 * top-left
 * top-right
 * top
 * bottom-left
 * bottom-right
 * bottom
 * right
 * left
 * center
 *
 * @example
 * ```js
 * calcTileType(0, 8); // 'top-left'
 * calcTileType(1, 8); // 'top'
 * calcTileType(63, 8); // 'bottom-right'
 * calcTileType(7, 7); // 'left'
 * ```
 * */
export function calcTileType(index, boardSize) {
  const isTopRow = index < boardSize;
  const isBottomRow = index >= boardSize * (boardSize - 1);
  const isLeftColumn = index % boardSize === 0;
  const isRightColumn = (index + 1) % boardSize === 0;

  if (isTopRow && isLeftColumn) return 'top-left';
  if (isTopRow && isRightColumn) return 'top-right';
  if (isBottomRow && isLeftColumn) return 'bottom-left';
  if (isBottomRow && isRightColumn) return 'bottom-right';
  if (isTopRow) return 'top';
  if (isBottomRow) return 'bottom';
  if (isLeftColumn) return 'left';
  if (isRightColumn) return 'right';
  return 'center';
}

export function calcHealthLevel(health) {
  if (health < 15) {
    return 'critical';
  }

  if (health < 50) {
    return 'normal';
  }

  return 'high';
}
