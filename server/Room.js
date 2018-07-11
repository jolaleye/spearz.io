const _ = require('lodash');
const { testPolygonPolygon } = require('sat');

const config = require('./config');
const { ID, getDistance } = require('./services/util');
const { pack } = require('./services/cereal');
const Player = require('./Player');
const Quadtree = require('./services/Quadtree');

class Room {
  constructor() {
    this.key = ID();
    this.connections = 0;
    this.clients = {};
    this.players = [];
    this.queue = [];
    this.qtree = new Quadtree({ x: 0, y: 0, length: config.arenaRadius * 2 });

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
    client.send(pack({ _: 'roomKey', key: this.key }));
  }

  removeClient(id) {
    this.clients = _.omitBy(this.clients, client => client.id === id);
    this.players = this.players.filter(player => player.id !== id);
    this.connections -= 1;
  }

  // bring a client into the game
  joinGame(client, nickname) {
    client.player = new Player(client, nickname);
    // add the client and player
    this.clients[client.id] = client;
    this.players.push(client.player);
    client.send(pack({ _: 'ready' }));
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

    // rebuild quadtree
    this.qtree.clear();
    this.players.forEach(player => {
      // exclude dead players
      if (!player.dead) this.qtree.insert(player.qt);
    });

    // check for spear hits
    this.players.forEach(player => {
      // skip if the player hasn't thrown their spear
      if (!player.released) return;

      // otherwise find potential collision candidates
      let candidates = this.qtree.retrieve(player.spear.qt);
      // filter out this player
      candidates = candidates.filter(candidate => candidate.id !== player.id);

      // convert candidates from their qt variant to their full object
      candidates = candidates.map(candidate => this.clients[candidate.id].player);

      // check collision with the remaining candidates
      candidates.forEach(candidate => {
        const hit = testPolygonPolygon(player.spear.bounds, candidate.bounds);
        if (!hit) return;

        player.released = false;
        this.clients[player.id].send(pack({ _: 'hit' }));
        candidate.damage(config.hitDamage, 'player', player.name);
        // check if the player hit is now dead
        if (candidate.dead) {
          player.increaseScore(config.killScore);
          this.clients[player.id].send(pack({ _: 'kill', name: candidate.name }));
        }
      });
    });
  }

  snapshot() {
    Object.values(this.clients).forEach(client => {
      client.send(pack({
        _: 'snapshot',
        timestamp: Date.now(),
        last: client.last,
        players: this.getNearbyPlayers(client, 1250).map(player => player.retrieve()),
      }));
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

    // create leaderboard-friendly variants of the players
    leaders = leaders.map(player => ({
      id: player.id,
      name: player.name,
      score: player.score,
      rank: player.rank,
    }));

    Object.values(this.clients).forEach(client => {
      const included = leaders.some(player => player.id === client.id);
      const list = leaders.slice();
      // if the client is not included, add them with their rank, score, etc. before sending
      if (!included) {
        list.push({
          id: client.player.id,
          name: client.player.name,
          score: client.player.score,
          rank: client.player.rank,
        });
      }
      // send the leaderboard
      client.send(pack({ _: 'leaderboard', players: list }));
    });
  }
}

module.exports = Room;

/* eslint no-param-reassign: off */
