const { ID } = require('./services/util');

class Room {
  constructor() {
    this.key = ID();
    this.connections = 0;
    this.clients = [];
  }

  removeClient(id) {
    this.clients = this.clients.filter(client => client.id !== id);
  }
}

module.exports = Room;
