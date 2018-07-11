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
    if (client && key && this.rooms[key] && this.rooms[key].connections < config.playerLimit) {
      this.rooms[key].addClient(client);
    }
  }

  // disconnect a client from their room
  disconnect(client) {
    if (!this.rooms[client.room]) return;

    this.rooms[client.room].removeClient(client.id);
    // remove empty rooms
    Object.values(this.rooms).forEach(room => {
      if (room.connections === 0) {
        delete this.rooms[room.id];
      }
    });
  }
}

module.exports = Lobby;

/* eslint no-param-reassign: off */
