const _ = require('lodash');

const config = require('./config');
const { ID } = require('./services/util');

class Room {
  constructor() {
    this.key = ID();
    this.connections = 0;
    this.clients = {};
    this.queue = [];

    // simulation tick
    setInterval(this.simulate.bind(this), config.tickrate);
  }

  removeClient(id) {
    this.clients = _.omitBy(this.clients, client => client.id === id);
    this.connections -= 1;
  }

  addToQueue(clientID, data) {
    this.queue.push({ clientID, target: data.target, tick: data.tick });
  }

  simulate() {
    this.queue.forEach((command, i) => {
      const client = this.clients[command.clientID];

      // skip if the client does not have a player / does not exist
      if (!client || !client.player) {
        this.queue.splice(i, 1);
        return;
      }

      client.player.move(command.target);

      this.queue.splice(i, 1);
    });
  }
}

module.exports = Room;
