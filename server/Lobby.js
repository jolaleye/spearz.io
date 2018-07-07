const _ = require('lodash');

const config = require('./config');
const { ID } = require('./services/util');
const { pack } = require('./services/cereal');
const Room = require('./Room');

class Lobby {
  constructor() {
    this.rooms = {};
  }

  initiate(client) {
    // assign the client an ID
    client.id = ID(2);
    client.send(pack({ _: 'id', id: client.id }));

    // find a room
    const room = this.findRoom();
    this.connect(client, room.key);
  }

  findRoom() {
    // find a room with space
    const roomKey = _.findKey(this.rooms, candidate => candidate.connections < config.playerLimit);
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
      client.send(pack({ _: 'keyMsg', code: 1, msg: 'You\'re already in that room!' }));
    } else if (!this.rooms[key]) {
      // room does not exist
      client.send(pack({ _: 'keyMsg', code: 0, msg: 'That room doesn\'t exist' }));
    } else if (this.rooms[key].connections >= config.playerLimit) {
      // room is full
      client.send(pack({ _: 'keyMsg', code: 0, msg: 'That room is full' }));
    } else {
      // room exists and has space
      this.disconnect(client);
      this.connect(client, key);
    }
  }

  // connect a client to a room
  connect(client, key) {
    // check for a client and key, that the room exists, and that the room has space
    if (!(client && key) || !this.rooms[key] || this.rooms[key].connections >= config.playerLimit) {
      return;
    }

    client.room = key;
    this.rooms[key].connections += 1;
    client.send(pack({ _: 'roomKey', key }));
  }

  // disconnect a client from their room
  disconnect(client) {
    this.rooms[client.room].connections -= 1;

    // remove empty rooms
    this.rooms = _.omitBy(this.rooms, room => room.connections === 0);
  }
}

module.exports = Lobby;

/* eslint class-methods-use-this: off */
/* eslint no-param-reassign: off */
