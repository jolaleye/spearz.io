const { id } = require('./util');

class Room {
  constructor() {
    this.id = id();
    this.players = [];
  }
}

module.exports = Room;
