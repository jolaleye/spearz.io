const _ = require('lodash');
const { testPolygonPolygon, testPolygonCircle } = require('sat');

const config = require('./config');
const { ID, getDistance, lerp } = require('./services/util');
const { pack } = require('./services/cereal');
const Player = require('./Player');
const Quadtree = require('./services/Quadtree');
const ScorePickup = require('./ScorePickup');

class Room {
  constructor() {
    this.key = ID();
    this.connections = 0;
    this.clients = {};
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
  }

  addClient(client) {
    client.room = this.key;
    this.connections += 1;
    client.send(pack('roomKey', { key: this.key }));
    client.last = 0;
  }

  removeClient(id, fromDeath) {
    // remove some pick-ups if the client was in the game
    if (this.clients[id] && this.clients[id].player) {
      _.times(config.scorePickups.onJoin, () => {
        const removed = this.scorePickups.shift();
        Object.values(this.clients).forEach(client => {
          if (client.player) client.send(pack('removeScorePickup', { id: removed.id }));
        });
      });
    }

    if (!fromDeath) {
      // if the disconnect was from closing tab/closing browser/drop/etc.
      this.connections -= 1;
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
    client.send(pack('ready'));

    // notify players through the feed
    Object.values(this.clients).forEach(clnt => {
      clnt.send(pack('feed', { type: 'join', names: [client.player.name] }));
    });

    // inform client of score pick-ups
    this.scorePickups.forEach(pickup => {
      client.send(pack('scorePickup', { ...pickup.retrieve() }));
    });

    // add more pick-ups
    this.addScorePickup(config.scorePickups.onJoin);
  }

  addToQueue(clientID, data) {
    this.queue.push({ clientID, target: data.target, tick: data.tick });
  }

  simulate() {
    this.tick += 1;

    // find each client's last command
    if (!_.isEmpty(this.queue)) {
      Object.values(this.clients).forEach(client => {
        const last = _.findLastIndex(this.queue, command => command.clientID === client.id);
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
      }

      client.player.move(command.target);

      this.queue.splice(i, 1);
    });

    // clear quadtree
    this.qtree.clear();

    // insert pick-ups
    this.scorePickups.forEach(pickup => this.qtree.insert(pickup.qt));

    // insert players, excluding dead players
    Object.values(this.clients).forEach(({ player }) => {
      if (!player.dead) this.qtree.insert(player.qt);
    });

    Object.values(this.clients).forEach(({ player }) => {
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
      candidate.id !== player.id && candidate.type === 'player'
    ));

    // convert candidates from their qt variant to their full object
    candidates = candidates.map(candidate => this.clients[candidate.id].player);

    // compensate for different latency factors
    candidates = this.rollback(_.cloneDeep(candidates), player.release);

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
        // expire the player in case they aren't removed
        setTimeout(() => this.removeClient(candidate.id, true), config.player.expiration);

        player.increaseScore(config.score.kill);
        this.clients[player.id].send(pack('kill', { name: candidate.name }));

        // notify players through the feed
        Object.values(this.clients).forEach(client => {
          client.send(pack('feed', { type: 'kill', names: [player.name, candidate.name] }));
        });
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
    let candidates = this.qtree.retrieve(player.spear.qt);
    // filter anything but score pickups
    candidates = candidates.filter(candidate => candidate.type === 'score');

    // convert candidates from their qt variant to their full object
    candidates = candidates.map(candidate => (
      this.scorePickups.find(pickup => pickup.id === candidate.id)
    ));

    // check collision with the remaining candidates
    candidates.forEach(candidate => {
      if (!player || !player.bounds || !candidate || !candidate.bounds) return;

      const hit = testPolygonCircle(player.bounds, candidate.bounds);
      if (!hit) return;

      // delete the pick-up and increase score
      this.scorePickups = this.scorePickups.filter(pickup => pickup.id !== candidate.id);
      Object.values(this.clients).forEach(client => {
        client.send(pack('removeScorePickup', { id: candidate.id }));
      });

      player.increaseScore(config.score.pickup);
      this.addScorePickup(1);
    });
  }

  addScorePickup(count) {
    _.times(count, () => {
      // add a pick-up
      const pickup = new ScorePickup();
      this.scorePickups.push(pickup);
      // inform clients of its position
      Object.values(this.clients).forEach(client => {
        client.send(pack('scorePickup', { ...pickup.retrieve() }));
      });
    });
  }

  snapshot() {
    // save a snapshot of the whole room
    const snapshot = {
      tick: this.tick,
      timestamp: Date.now(),
      players: _.cloneDeep(this.players),
    };
    // keep a history of the last second of snapshots
    if (this.history.length === 20) this.history.shift();
    this.history.push(snapshot);

    Object.values(this.clients).forEach(client => {
      client.send(pack('snapshot', {
        timestamp: Date.now().toString(),
        tick: this.tick,
        last: client.last,
        players: this.getNearbyPlayers(client, client.viewDistance)
          .map(clnt => clnt.player.retrieve()),
      }));
    });
  }

  updateLeaderboard() {
    const players = Object.values(this.clients).map(client => client.player);
    if (_.isEmpty(players)) return;

    // sort players by score
    const sorted = _.sortBy(players, ['score']).reverse();

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
    return Object.values(this.clients).filter(({ player }) => {
      const distance = getDistance(
        client.player.pos.x, player.pos.x,
        client.player.pos.y, player.pos.y,
      );

      return distance.total <= maxDistance + 100;
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
