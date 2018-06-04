const { testPolygonPolygon } = require('sat');
const _ = require('lodash');

const config = require('./config');
const { createId, getDistance } = require('./util');

class Room {
  constructor(io) {
    this.id = createId();
    this.connections = 0;
    this.players = [];
    this.io = io;
  }

  update(activePlayer) {
    // if the active player has thrown their spear check for hits
    if (activePlayer.thrown) {
      this.fetchPlayers(activePlayer, false).forEach(otherPlayer => {
        // test for collision between the spear and a player
        if (testPolygonPolygon(activePlayer.spear.hitbox, otherPlayer.hitbox)) {
          this.io.sockets.to(activePlayer.id).emit('hit');
          this.io.sockets.to(otherPlayer.id).emit('hit');
          activePlayer.resetSpear();
          otherPlayer.takeDamage(config.damageOnHit);

          // if the player hit is now dead
          if (!otherPlayer.checkStatus()) {
            activePlayer.increaseScore(config.scorePerKil);
            this.io.sockets.to(activePlayer.id).emit('message', {
              type: 'kill',
              name: otherPlayer.name ? otherPlayer.name : '<unnamed>',
              duration: 3,
            });

            // eslint-disable-next-line
            otherPlayer.deathMsg = {
              type: 'player',
              name: activePlayer.name ? activePlayer.name : '<unnamed>',
            };
            this.removePlayer(otherPlayer.id);
          }
        }
      });
    }
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

  createLeaderboard(activePlayer) {
    const leaders = _.sortBy(this.players, ['score']).reverse();
    if (leaders.length > 10) leaders.splice(10);
    // if the active player is not in the top 10, add them to the bottom
    if (!leaders.includes(activePlayer)) leaders.push(activePlayer);

    return leaders.map((player, i) => ({
      name: player.name === '' ? '<unnamed>' : player.name,
      score: player.score,
      rank: i + 1,
      active: player.id === activePlayer.id,
    }));
  }
}

module.exports = Room;
