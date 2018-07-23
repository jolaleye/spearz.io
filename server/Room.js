const _ = require('lodash');
const { testPolygonPolygon, testPolygonCircle } = require('sat');

const config = require('./config');
const { ID, getDistance, lerp } = require('./services/util');
const { pack } = require('./services/cereal');
const Player = require('./Player');
const Quadtree = require('./services/Quadtree');
const ScorePickup = require('./ScorePickup');
const Bot = require('./services/Bot');

class Room {
  constructor() {
    this.key = ID();
    this.connections = 0;
    this.clients = {};
    this.players = [];
    this.queue = [];
    this.qtree = new Quadtree({ x: 0, y: 0, length: config.arenaRadius * 2 });

    // add initial score pick-ups
    this.scorePickups = [];
    this.addScorePickup(config.scorePickups.initialCount);

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
    _.times(config.bots.count, this.deployBot.bind(this));
  }

  addClient(client) {
    client.room = this.key;
    this.connections += 1;
    client.send(pack('roomKey', { key: this.key }));
    client.last = 0;
  }

  removeClient(id, fromDeath) {
    if (this.clients[id] && this.clients[id].player) {
      // remove the player
      this.players.splice(this.players.indexOf(this.clients[id].player), 1);

      // remove pick-ups
      _.times(config.scorePickups.onJoin, () => this.scorePickups.shift());
    }

    if (!fromDeath) {
      // if the disconnect was from closing tab/closing browser/drop/etc.
      this.connections -= 1;

      // if the room is only bots, destroy them all
      const allBots = !Object.values(this.clients).some(client => !client.isBot);
      if (allBots) this.bots.forEach(b => b.destroy());

      if (!this.clients[id]) return;

      // notify players through the feed
      Object.values(this.clients).forEach(client => {
        client.send(pack('feed', { type: 'leave', names: [this.clients[id].player.name] }));
      });

      delete this.clients[id];
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
    this.addScorePickup(config.scorePickups.onJoin);
  }

  addToQueue(type, clientID, data) {
    if (type === 'target') {
      this.queue.push({ type, clientID, target: data.target, tick: data.tick });
    } else if (type === 'throw') {
      this.queue.push({ type, clientID, delta: data.delta, tick: data.tick });
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
        client.player.throwSpear(command.tick, command.delta);
      }

      this.queue.splice(i, 1);
    });

    // clear quadtree
    this.qtree.clear();

    // insert pick-ups
    this.scorePickups.forEach(pickup => this.qtree.insert(pickup));

    // insert players, excluding dead players
    this.players.forEach(player => {
      if (!player.dead) this.qtree.insert(player);
    });

    this.players.forEach(player => {
      // check for hits if the player has thrown their spear
      if (player.released) this.checkSpearHits(player);
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
    // candidates = this.rollback(_.cloneDeep(candidates), player.release);

    // check collision with the remaining candidates
    candidates.forEach(candidate => {
      if (!player || !player.spear || !player.spear.bounds || !candidate || !candidate.bounds) {
        return;
      }

      const hit = testPolygonPolygon(player.spear.bounds, candidate.bounds);
      if (!hit) return;

      player.released = false;
      this.clients[player.id].send(pack('hit'));
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
        setTimeout(() => this.removeClient(candidate.id, true), config.player.expiration);
      }
    });
  }

  rollback(players, { tick, delta }) {
    // find the snapshot with the given tick
    const snapshot = this.history.find(snap => snap.tick === tick);
    // and the next one
    const nextSnapshot = this.history[this.history.indexOf(snapshot) + 1];

    if (!snapshot || !nextSnapshot) return players;

    players.forEach(player => {
      // states in the last and next snapshots
      const s1 = snapshot.players.find(plyr => plyr.id === player.id);
      const s2 = nextSnapshot.players.find(plyr => plyr.id === player.id);

      if (!s1 || !s2) return;

      const t = _.clamp(delta / (nextSnapshot.timestamp - snapshot.timestamp), 1);
      // roll player positions back to that snapshot + the delta
      player.pos.x = lerp(s1.pos.x, s2.pos.x, t);
      player.pos.y = lerp(s1.pos.y, s2.pos.y, t);
    });

    return players;
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
      const index = this.scorePickups.findIndex(pickup => pickup.id === candidate.id);
      if (index) this.scorePickups.splice(index, 1);

      player.increaseScore(config.score.pickup);
      this.addScorePickup(1);
    });
  }

  addScorePickup(count) {
    _.times(count, () => {
      const pickup = new ScorePickup();
      this.scorePickups.push(pickup);
    });
  }

  snapshot() {
    // keep a history of the last second of snapshots
    if (this.history.length === 20) this.history.shift();
    this.history.push({
      tick: this.tick,
      timestamp: Date.now(),
      players: this.players,
    });

    Object.values(this.clients).forEach(client => {
      const snapshot = {
        timestamp: Date.now().toString(),
        tick: this.tick,
        last: client.last,
        players: this.getNearbyPlayers(client, client.viewDistance)
          .map(player => player.retrieve()),
        pickups: this.getNearbyPickups(client, client.viewDistance)
          .map(pickup => pickup.retrieve()),
      };

      client.lastSnapshot = snapshot;
      client.send(pack('snapshot', snapshot));
    });
  }

  ping() {
    Object.values(this.clients).forEach(client => {
      client.startTime = Date.now();
      client.send('ping');
    });
  }

  updateLeaderboard() {
    if (_.isEmpty(this.players)) return;

    // sort players by score
    const sorted = _.sortBy(this.players, ['score']).reverse();

    // give each player their rank
    sorted.forEach((player, i) => {
      player.rank = i + 1;
    });

    // cut down to the top 10
    let leaders = sorted.slice(0, 10);

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
    return this.players.filter(player => {
      const distance = getDistance(
        client.player.pos.x, player.pos.x,
        client.player.pos.y, player.pos.y,
      );

      return distance.total <= maxDistance + 100;
    });
  }

  getNearbyPickups(client, maxDistance = 1000) {
    return this.scorePickups.filter(pickup => {
      const distance = getDistance(
        client.player.pos.x, pickup.pos.x,
        client.player.pos.y, pickup.pos.y,
      );

      return distance.total <= maxDistance;
    });
  }

  deployBot() {
    const bot = new Bot(this.key);
    this.bots.push(bot);

    bot.on('created', () => {
      this.clients[bot.id].isBot = true;
    });

    bot.on('dead', () => {
      bot.destroy();

      const index = this.bots.findIndex(({ botID }) => botID === bot.botID);
      if (this.bots[index]) this.bots.splice(index, 1);

      // deploy another bot if there aren't enough players yet
      const nonBots = this.players.length - this.bots.length;
      const allBots = !Object.values(this.clients).some(client => !client.isBot);
      if (nonBots < config.bots.keepUntil && !allBots) this.deployBot();
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
