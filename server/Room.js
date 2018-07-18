const _ = require('lodash');
const { testPolygonPolygon, testPolygonCircle } = require('sat');

const config = require('./config');
const { ID, getDistance } = require('./services/util');
const { pack } = require('./services/cereal');
const Player = require('./Player');
const Quadtree = require('./services/Quadtree');
const ScorePickup = require('./ScorePickup');

class Room {
  constructor() {
    this.key = ID();
    this.connections = 0;
    this.clients = {};
    this.players = [];
    this.queue = [];
    this.qtree = new Quadtree({ x: 0, y: 0, length: config.arenaRadius * 2 });
    this.scorePickups = [];

    // add initial score pick-ups
    _.times(config.scorePickups.initialCount, () => this.scorePickups.push(new ScorePickup()));

    // simulation tick
    setInterval(this.simulate.bind(this), config.tickrate);
    // snapshot tick
    setInterval(this.snapshot.bind(this), config.snapshotRate);
    // send clients the leaderboard
    setInterval(this.updateLeaderboard.bind(this), config.leaderboardRate);
  }

  addClient(client) {
    client.room = this.key;
    this.connections += 1;
    client.send(pack('roomKey', { key: this.key }));
    client.last = 0;
  }

  removeClient(id, fromDeath) {
    // notify players through the feed
    if (!fromDeath) {
      Object.values(this.clients).forEach(client => {
        if (!this.clients[id] || !this.clients[id].player) return;
        client.send(pack('feed', { type: 'leave', names: [this.clients[id].player.name] }));
      });
    }

    delete this.clients[id];
    this.players = this.players.filter(player => player.id !== id);
    this.connections -= 1;
  }

  // bring a client into the game
  joinGame(client, nickname) {
    client.player = new Player(client, nickname);
    // add the client and player
    this.clients[client.id] = client;
    this.players.push(client.player);
    client.send(pack('ready'));

    // notify players through the feed
    Object.values(this.clients).forEach(clnt => {
      clnt.send(pack('feed', { type: 'join', names: [client.player.name] }));
    });

    // add more pick-ups
    _.times(config.scorePickups.onJoin, () => this.scorePickups.push(new ScorePickup()));
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

    // execute command queue
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

    // clear quadtree
    this.qtree.clear();

    // insert pick-ups
    this.scorePickups.forEach(pickup => this.qtree.insert(pickup.qt));

    // insert players, excluding dead players
    this.players.forEach(player => {
      if (!player.dead) this.qtree.insert(player.qt);
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
    let candidates = this.qtree.retrieve(player.spear.qt);
    // filter out this player and pick-ups
    candidates = candidates.filter(candidate => (
      candidate.id !== player.id && candidate.type !== 'score'
    ));

    // convert candidates from their qt variant to their full object
    candidates = candidates.map(candidate => this.clients[candidate.id].player);

    // check collision with the remaining candidates
    candidates.forEach(candidate => {
      const hit = testPolygonPolygon(player.spear.bounds, candidate.bounds);
      if (!hit) return;

      player.released = false;
      this.clients[player.id].send(pack('hit'));
      candidate.damage(config.damage.hit, 'player', player.name);

      // check if the player hit is now dead
      if (candidate.dead) {
        player.increaseScore(config.score.kill);
        this.clients[player.id].send(pack('kill', { name: candidate.name }));

        // notify players through the feed
        Object.values(this.clients).forEach(client => {
          client.send(pack('feed', { type: 'kill', names: [player.name, candidate.name] }));
        });
      }
    });
  }

  checkPickups(player) {
    // find potential collision candidates
    let candidates = this.qtree.retrieve(player.spear.qt);
    // filter out players
    candidates = candidates.filter(candidate => candidate.type !== 'player');

    // convert candidates from their qt variant to their full object
    candidates = candidates.map(candidate => (
      this.scorePickups.find(pickup => pickup.id === candidate.id)
    ));

    // check collision with the remaining candidates
    candidates.forEach(candidate => {
      const hit = testPolygonCircle(player.bounds, candidate.bounds);
      if (!hit) return;

      // delete the pick-up and increase score
      this.scorePickups = this.scorePickups.filter(pickup => pickup.id !== candidate.id);
      player.increaseScore(config.score.pickup);

      // add a new pick-up
      this.scorePickups.push(new ScorePickup());
    });
  }

  snapshot() {
    Object.values(this.clients).forEach(client => {
      client.send(pack('snapshot', {
        timestamp: Date.now().toString(),
        last: client.last,
        players: this.getNearbyPlayers(client, 1250).map(player => player.retrieve()),
        scorePickups: this.getNearbyScorePickups(client, 1250).map(pickup => pickup.retrieve()),
      }));
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

  getNearbyPlayers(client, maxDistance) {
    return this.players.filter(player => {
      const distance = getDistance(
        client.player.pos.x, player.pos.x,
        client.player.pos.y, player.pos.y,
      );

      return distance.total <= maxDistance;
    });
  }

  getNearbyScorePickups(client, maxDistance) {
    return this.scorePickups.filter(pickup => {
      const distance = getDistance(
        client.player.pos.x, pickup.pos.x,
        client.player.pos.y, pickup.pos.y,
      );

      return distance.total <= maxDistance;
    });
  }
}

module.exports = Room;

/* eslint no-param-reassign: off */
