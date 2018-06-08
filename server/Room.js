const { testPolygonPolygon } = require('sat');
const _ = require('lodash');

const config = require('./config');
const { ID, getDistance } = require('./services/util');
const { encode } = require('./services/parser');

class Room {
  constructor() {
    this.id = ID();
    this.connections = 0;
    this.players = [];
    this.leaderboard = [];
  }

  update(activePlayer) {
    this.checkHits(activePlayer);
    this.clearPlayers();
    this.updateLeaderboard(activePlayer);
  }

  checkHits(activePlayer) {
    // if the active player has thrown their spear check for hits
    if (activePlayer.thrown) {
      this.fetchPlayers(activePlayer, false).forEach(otherPlayer => {
        // test for collision between the spear and a player
        if (testPolygonPolygon(activePlayer.spear.hitbox, otherPlayer.hitbox)) {
          activePlayer.socket.send(encode('hit'));
          otherPlayer.socket.send(encode('hit'));

          activePlayer.resetSpear();
          otherPlayer.takeDamage(config.damageOnHit);

          // if the player hit is now dead
          if (!otherPlayer.health > 0) {
            activePlayer.increaseScore(config.scorePerKil);
            activePlayer.socket.send(encode('message', {
              type: 'kill',
              target: '',
              duration: 3,
              msg: otherPlayer.name ? otherPlayer.name : '<unnamed>',
            }));

            // eslint-disable-next-line
            otherPlayer.deathMsg = {
              type: 'player',
              name: activePlayer.name ? activePlayer.name : '<unnamed>',
            };
          }
        }
      });
    }
  }

  // check for players that are dead but haven't been removed
  clearPlayers() {
    this.players.forEach(player => {
      if (!player.dead) return;
      if (((Date.now() - player.dead) / 1000) > 3) {
        this.removePlayer(player.id);
        player.socket.send(encode('dead', { ...player.deathMsg }));
      }
    });
  }

  fetchPlayers(activePlayer, include) {
    // fetches players within 1250 units of the active player
    // includes / doesn't include the active player based on include param
    return this.players.filter(player => {
      const distance = getDistance(
        activePlayer.pos.x, player.pos.x,
        activePlayer.pos.y, player.pos.y,
      );
      return (distance.total <= 1250) && (include ? true : player.id !== activePlayer.id);
    });
  }

  removePlayer(id) {
    this.players = this.players.filter(player => player.id !== id);
  }

  updateLeaderboard(activePlayer) {
    const leaders = _.sortBy(this.players, ['score']).reverse();
    if (leaders.length > 10) leaders.splice(10);
    // if the active player is not in the top 10, add them to the bottom
    if (!leaders.includes(activePlayer)) leaders.push(activePlayer);

    const newLeaderboard = leaders.map((player, i) => ({
      name: player.name === '' ? '<unnamed>' : player.name,
      score: player.score,
      rank: i + 1,
      active: player.id === activePlayer.id,
    }));

    if (!_.isEqual(newLeaderboard, this.leaderboard)) {
      this.leaderboard = newLeaderboard;
      activePlayer.socket.send(encode('leaderboard', { leaderboard: this.leaderboard }));
    }
  }
}

module.exports = Room;
