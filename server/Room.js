const _ = require('lodash');

const config = require('./config');
const { ID, getDistance } = require('./services/util');
const { pack } = require('./services/cereal');

class Room {
  constructor() {
    this.key = ID();
    this.connections = 0;
    this.clients = {};
    this.players = [];
    this.queue = [];

    // simulation tick
    setInterval(this.simulate.bind(this), config.tickrate);
    // snapshot tick
    setInterval(this.snapshot.bind(this), config.snapshotRate);
  }

  addClient(client) {
    client.room = this.key;
    this.connections += 1;
    client.send(pack({ _: 'roomKey', key: this.key }));
  }

  removeClient(id) {
    this.clients = _.omitBy(this.clients, client => client.id === id);
    this.players = this.players.filter(player => player.id !== id);
    this.connections -= 1;
  }

  addToQueue(clientID, data) {
    this.queue.push({ clientID, target: data.target, tick: data.tick });
  }

  simulate() {
    if (_.isEmpty(this.queue)) return;

    // find each client's last command
    Object.values(this.clients).forEach(client => {
      const last = _.findLastIndex(this.queue, command => command.clientID === client.id);
      if (this.queue[last]) client.last = this.queue[last].tick;
    });

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

  snapshot() {
    Object.values(this.clients).forEach(client => {
      client.send(pack({
        _: 'snapshot',
        timestamp: Date.now(),
        last: client.last,
        players: this.getNearbyPlayers(client),
      }));
    });
  }

  getNearbyPlayers(client) {
    return this.players.filter(player => {
      const distance = getDistance(
        client.player.pos.x, player.pos.x,
        client.player.pos.y, player.pos.y,
      );

      return distance.total <= 1250;
    });
  }
}

module.exports = Room;

/* eslint no-param-reassign: off */
