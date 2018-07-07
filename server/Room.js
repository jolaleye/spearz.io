const { ID } = require('./services/util');

class Room {
  constructor() {
    this.key = ID();
    this.connections = 0;
  }
}

module.exports = Room;
