const _ = require('lodash');

const config = require('./config');
const { ID } = require('./services/util');
const { pack } = require('./services/cereal');
const Room = require('./Room');

class Lobby {
  constructor() {
    this.rooms = {};

    setInterval(this.log.bind(this), config.logFreq);
  }

  log() {
    const roomCount = Object.keys(this.rooms).length;

    let playerCount = 0;
    Object.values(this.rooms).forEach(room => {
      playerCount += room.players.length;
    });

    console.log(`${roomCount} rooms\t${playerCount} players`);
  }

  initiate(client) {
    // assign the client an ID
    client.id = ID(2);
    client.send(pack('id', { id: client.id }));

    // ping
    client.pingTime = Date.now();
    client.send(pack('ping'));

    // find a room
    const room = this.findRoom();
    this.connect(client, room.key);
  }

  findRoom() {
    // find a room with space
    const roomKey = _.findKey(this.rooms, room => room.connections < config.playerLimit);
    let room = this.rooms[roomKey];
    // create a new room if they're all full
    if (!room) {
      room = new Room();
      this.rooms[room.key] = room;
    }

    return room;
  }

  joinRoom(client, key) {
    if (key === client.room) {
      // client is already in the room
      client.send(pack('keyMsg', { code: 1, msg: 'You\'re already in that room!' }));
    } else if (!this.rooms[key]) {
      // room does not exist
      client.send(pack('keyMsg', { code: 0, msg: 'That room doesn\'t exist' }));
    } else if (this.rooms[key].connections >= config.playerLimit) {
      // room is full
      client.send(pack('keyMsg', { code: 0, msg: 'That room is full' }));
    } else {
      // room exists and has space
      this.disconnect(client);
      this.connect(client, key);
    }
  }

  // connect a client to a room
  connect(client, key) {
    // check for a client and key, that the room exists, and that the room has space
    if (client && key && this.rooms[key] && this.rooms[key].connections < config.playerLimit) {
      this.rooms[key].addClient(client);
    }
  }

  // disconnect a client from their room
  disconnect(client, fromDeath = false) {
    if (!this.rooms[client.room]) return;

    this.rooms[client.room].removeClient(client.id, fromDeath);

    // close the room if it's now empty
    if (this.rooms[client.room].connections === 0) {
      this.rooms[client.room].close();
      delete this.rooms[client.room];
    }
  }
}

module.exports = Lobby;

/* eslint no-param-reassign: off */
