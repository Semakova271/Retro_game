export default class GameState {
  constructor() {
    this.level = 1;
    this.score = 0;
    this.maxScore = 0;
    this.fieldState = null; // Состояние игрового поля (например, массив с данными)
  }

  static from(object) {
    if (!object) {
      return null;
    }

    const state = new GameState();
    state.level = object.level || 1;
    state.score = object.score || 0;
    state.maxScore = object.maxScore || 0;
    state.fieldState = object.fieldState || null;

    return state;
  }
}
