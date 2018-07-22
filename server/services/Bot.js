const EventEmitter = require('events');
const WebSocket = require('uws');
const _ = require('lodash');

const { pack, unpack } = require('./cereal');
const { ID } = require('./util');

class Bot extends EventEmitter {
  constructor(roomKey) {
    super();

    this.roomKey = roomKey;

    this.botID = ID();
    this.socket = new WebSocket(`ws://localhost:${process.env.PORT || 3001}`);

    this.socket.on('open', () => {
      this.socket.send(pack('joinRoom', { key: roomKey }));
    });

    this.socket.on('message', packet => {
      const data = unpack(packet);
      switch (data._) {
        case 'id':
          this.id = data.id;
          break;

        case 'ready':
          if (this.id) this.emit('created');
          break;

        case 'keyMsg':
          // destroy the bot if it can't join its designated room
          if (data.code === 1) this.join();
          else this.destroy();
          break;

        case 'roomKey':
          if (data.key === this.roomKey) this.join();
          break;

        case 'snapshot':
          this.update(data.players.find(player => player.id === this.id));
          break;

        case 'dead':
          this.emit('dead');
          break;

        default: break;
      }
    });

    // super complex artificial intelligence
    this.tick = 0;
    this.ticker = setInterval(this.move.bind(this), 33);
  }

  join() {
    if (!this.joined) this.socket.send(pack('joinGame', { nickname: '{•̃_•̃}' }));
    this.joined = true;
  }

  update(player) {
    if (player) this.player = player;
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
    clearInterval(this.ticker);
    this.socket.close();
  }
}

module.exports = Bot;
