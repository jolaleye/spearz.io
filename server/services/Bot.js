const EventEmitter = require('events');
const WebSocket = require('uws');
const _ = require('lodash');

const { pack, unpack } = require('./cereal');
const { ID } = require('./util');

class Bot extends EventEmitter {
  constructor() {
    super();

    this.botID = ID();
    this.socket = new WebSocket(`ws://localhost:${process.env.PORT || 3001}`);

    this.socket.on('open', () => {
      this.socket.send(pack('joinGame', { nickname: '{•̃_•̃}' }));
    });

    this.socket.on('message', packet => {
      const data = unpack(packet);
      switch (data._) {
        case 'id':
          this.id = data.id;
          break;

        case 'roomKey':
          this.room = data.key;
          break;

        case 'snapshot':
          this.update(data.players.find(player => player.id === this.id));
          break;

        case 'dead':
          this.destroy();
          break;

        default: break;
      }
    });

    // super complex artificial intelligence
    this.tick = 0;
    setInterval(this.move.bind(this), 33);
  }

  update(player) {
    // if the player is missing, destroy the bot
    if (!player) {
      this.destroy();
    } else {
      // otherwise, update
      this.player = player;
    }
  }

  move() {
    if (!this.player) return;

    this.tick += 1;
    const { direction, pos } = this.player;

    const posNeg = (Math.round(Math.random()) * 2) - 1;
    const newDirection = direction + ((_.random(Math.PI * 2) / 30) * posNeg);

    const target = {
      x: pos.x + (Math.cos(newDirection) * 90),
      y: pos.y + (Math.sin(newDirection) * 90),
    };

    this.socket.send(pack('target', { target, tick: this.tick }));
  }

  destroy() {
    this.socket.close();
    this.emit('destroy');
  }
}

module.exports = Bot;
