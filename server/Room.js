const _ = require('lodash');
const { testPolygonPolygon, testPolygonCircle } = require('sat');

const config = require('./config');
const { ID, getDistance } = require('./services/util');
const { pack } = require('./services/cereal');
const Player = require('./Player');
const Quadtree = require('./services/Quadtree');
const Pickup = require('./Pickup');
const Bot = require('./services/Bot');

class Room {
  constructor() {
    this.key = ID();
    this.connections = 0;
    this.clients = {};
    this.players = [];
    this.queue = [];
    this.qtree = new Quadtree({ x: 0, y: 0, length: config.arenaRadius * 2 });
    this.locked = false;

    // add initial score pick-ups
    this.pickups = [];
    this.addPickup(config.pickups.initialCount);

    // simulation tick
    this.tick = 0;
    this.simTick = setInterval(this.simulate.bind(this), config.tickrate);

    // snapshot tick
    this.history = [];
    this.snapTick = setInterval(this.snapshot.bind(this), config.snapshotRate);

    // send clients the leaderboard
    this.lbTick = setInterval(this.updateLeaderboard.bind(this), config.leaderboardRate);

    // measure each client's latency
    this.pingPong = setInterval(this.ping.bind(this), config.pingRate);

    // rooms start with some bots so they aren't completely empty
    this.bots = [];
    _.times(config.bots.count - 1, this.deployBot.bind(this));
  }

  addClient(client) {
    client.room = this.key;
    this.connections += 1;
    client.send(pack('roomKey', { key: this.key }));
    client.last = 0;
  }

  removeClient(id, left) {
    // client had a player
    if (this.clients[id] && this.clients[id].player) {
      // remove the player
      const index = this.players.indexOf(this.clients[id].player);
      if (this.players[index]) this.players.splice(index, 1);

      // remove pick-ups
      _.times(config.pickups.onJoin, () => this.pickups.shift());
    }

    // client left the game
    if (left) {
      this.connections -= 1;

      const wasReal = this.clients[id] ? !this.clients[id].isBot : true;
      const someReal = Object.values(this.clients).some(client => !client.isBot);
      // if the room is only bots and it wasn't a bot that just left, destroy them all
      if (!someReal && wasReal) {
        this.locked = true;
        this.bots.forEach(bot => bot.destroy());
        this.bots = [];
        return;
      }

      if (!this.clients[id]) return;

      // notify players through the feed
      Object.values(this.clients).forEach(client => {
        client.send(pack('feed', { type: 'leave', names: [this.clients[id].player.name] }));
      });

      delete this.clients[id];
    }

    // deploy bots if there aren't enough players
    if (this.players.length < config.bots.count && !this.locked) {
      _.times(config.bots.count - this.players.length, this.deployBot.bind(this));
    }
  }

  // bring a client into the game
  joinGame(client, nickname) {
    this.clients[client.id] = client;
    client.player = new Player(client, nickname);
    this.players.push(client.player);
    client.send(pack('ready'));

    // notify players through the feed
    Object.values(this.clients).forEach(clnt => {
      clnt.send(pack('feed', { type: 'join', names: [client.player.name] }));
    });

    // add more pick-ups
    this.addPickup(config.pickups.onJoin);
  }

  addToQueue(type, clientID, data) {
    if (type === 'target') {
      this.queue.push({ type, clientID, target: data.target, tick: data.tick });
    } else if (type === 'throw') {
      this.queue.push({ type, clientID });
    }
  }

  simulate() {
    this.tick += 1;

    // find each client's last target command
    if (!_.isEmpty(this.queue)) {
      Object.values(this.clients).forEach(client => {
        const last = _.findLastIndex(this.queue, command => (
          command.clientID === client.id && command.type === 'target'
        ));
        if (this.queue[last]) client.last = this.queue[last].tick;
      });
    }

    // execute command queue
    this.queue.forEach((command, i) => {
      const client = this.clients[command.clientID];
      // skip if the client does not have a player / does not exist / is dead
      if (!client || !client.player || client.player.dead) {
        this.queue.splice(i, 1);
        return;
      } else if (command.type === 'target') {
        client.player.move(command.target);
      } else if (command.type === 'throw') {
        client.player.throwSpear();
      }

      this.queue.splice(i, 1);
    });

    // clear quadtree
    this.qtree.clear();

    // insert pick-ups
    this.pickups.forEach(pickup => this.qtree.insert(pickup));

    // insert players, excluding dead players
    this.players.forEach(player => {
      if (!player.dead) this.qtree.insert(player);
    });

    this.players.forEach(player => {
      // check for hits if the player has thrown their spear
      if (player.released && player.release) this.checkSpearHits(player);
      // check for collisions with pick-ups
      this.checkPickups(player);
    });
  }

  checkSpearHits(player) {
    // find potential collision candidates
    let candidates = this.qtree.retrieve(player.spear);

    // filter out this player and pick-ups
    candidates = candidates.filter(candidate => (
      candidate.id !== player.id && candidate.type === 'player'
    ));

    // compensate for different latency factors
    candidates = this.rollback(candidates, player.release);

    // check collision with the remaining candidates
    candidates.forEach(candidate => {
      if (!player || !player.spear || !player.spear.bounds || !candidate || !candidate.bounds) {
        return;
      }

      const hit = testPolygonPolygon(player.spear.bounds, candidate.bounds);
      if (!hit) return;

      player.released = false;
      this.clients[candidate.id].send(pack('hit'));
      this.clients[candidate.id].player.damage(config.damage.hit, 'player', player.name);

      // check if the player hit is now dead
      if (this.clients[candidate.id].player.dead) {
        player.increaseScore(config.score.kill);
        this.clients[player.id].send(pack('kill', { name: candidate.name }));

        // notify players through the feed
        Object.values(this.clients).forEach(client => {
          client.send(pack('feed', { type: 'kill', names: [player.name, candidate.name] }));
        });

        // expire the player in case they aren't removed
        setTimeout(() => this.removeClient(candidate.id), config.player.expiration);
      }
    });
  }

  rollback(candidates, release) {
    const closestSnapshot = time => {
      let closest = Number.MAX_SAFE_INTEGER;
      let index = 0;

      this.history.forEach((snapshot, i) => {
        const elapsed = Math.abs(time - snapshot.timestamp);
        if (elapsed < closest && snapshot.timestamp < time) {
          index = i;
          closest = elapsed;
        }
      });

      return index;
    };

    // time since the player's throw
    const delta = Date.now() - release;

    // find the snapshot closest to and before the current spear time
    const snapshot = this.history[closestSnapshot(release + delta)];

    if (!snapshot) return candidates;

    // return the candidates from the snapshot
    return snapshot.players.filter(player => (
      candidates.some(candidate => candidate.id === player.id)
    ));
  }

  checkPickups(player) {
    // find potential collision candidates
    let candidates = this.qtree.retrieve(player.spear);

    // filter out anything but score pickups
    candidates = candidates.filter(candidate => candidate.type === 'score');

    // check collision with the remaining candidates
    candidates.forEach(candidate => {
      if (!player || !player.bounds || !candidate || !candidate.bounds) return;

      const hit = testPolygonCircle(player.bounds, candidate.bounds);
      if (!hit) return;

      // delete the pick-up and increase score
      const index = this.pickups.indexOf(candidate);
      if (this.pickups[index]) this.pickups.splice(index, 1);

      player.increaseScore(config.score.pickup);
      this.addPickup(1);
    });
  }

  addPickup(count) {
    _.times(count, () => {
      const pickup = new Pickup();
      this.pickups.push(pickup);
    });
  }

  snapshot() {
    // keep a history of snapshots
    if (this.history.length === 25) this.history.shift();
    this.history.push({
      tick: this.tick,
      timestamp: Date.now(),
      players: _.cloneDeep(this.players),
    });

    Object.values(this.clients).forEach(client => {
      const snapshot = {
        timestamp: Date.now().toString(),
        tick: this.tick,
        last: client.last,
        players: this.getNearbyPlayers(client, client.viewDistance),
        pickups: this.getNearbyPickups(client, client.viewDistance),
      };

      client.lastSnapshot = snapshot;
      client.send(pack('snapshot', snapshot));
    });
  }

  ping() {
    Object.values(this.clients).forEach(client => {
      client.pingTime = Date.now();
      client.send(pack('ping'));
    });
  }

  updateLeaderboard() {
    if (_.isEmpty(this.players)) return;

    // sort players by score
    let leaders = _.sortBy(this.players, ['score']).reverse();

    // exclude dead players
    leaders = leaders.filter(player => !player.dead);

    // give each player their rank
    leaders.forEach((player, i) => {
      player.rank = i + 1;
    });

    // cut down to the top 10
    leaders = leaders.slice(0, 10);

    // convert to leaderboard-friendly variants of the players
    leaders = leaders.map(player => player.lb);

    Object.values(this.clients).forEach(client => {
      const list = leaders.slice();

      // if the client is not included, add them with their rank, score, etc. before sending
      const included = leaders.some(player => player.id === client.id);
      if (!included) list.push(client.player.lb);

      client.send(pack('leaderboard', { players: list }));
    });
  }

  getNearbyPlayers(client, maxDistance = 1000) {
    const players = this.players.filter(player => {
      const distance = getDistance(
        client.player.pos.x, player.pos.x,
        client.player.pos.y, player.pos.y,
      );

      return distance.total <= maxDistance;
    });

    return players.map(player => player.retrieve());
  }

  getNearbyPickups(client, maxDistance = 1000) {
    const pickups = this.pickups.filter(pickup => {
      const distance = getDistance(
        client.player.pos.x, pickup.pos.x,
        client.player.pos.y, pickup.pos.y,
      );

      return distance.total <= maxDistance;
    });

    return pickups.map(pickup => pickup.retrieve());
  }

  deployBot() {
    const bot = new Bot(this.key);
    this.bots.push(bot);

    bot.on('created', () => {
      this.clients[bot.id].isBot = true;
    });

    bot.on('dead', () => {
      bot.destroy();
      const index = this.bots.indexOf(bot);
      if (this.bots[index]) this.bots.splice(index, 1);
    });
  }

  close() {
    clearInterval(this.simTick);
    clearInterval(this.snapTick);
    clearInterval(this.lbTick);
  }
}

module.exports = Room;

/* eslint no-param-reassign: off */
