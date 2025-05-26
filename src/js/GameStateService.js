export default class GameStateService {
  constructor(storage) {
    this.storage = storage;
  }

  save(state) {
    this.storage.setItem('state', JSON.stringify(state));
  }

  load() {
    try {
      const data = this.storage.getItem('state');
      return JSON.parse(data);
    } catch (e) {
      throw new Error('Invalid state');
    }
  }
}