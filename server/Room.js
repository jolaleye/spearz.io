const { testPolygonPolygon } = require('sat');
const _ = require('lodash');

const config = require('./config');
const { createId, getDistance } = require('./util');

class Room {
  constructor() {
    this.id = createId();
    this.players = [];
  }

  update(activePlayer) {
    // if the active player has thrown their spear check for hits
    if (activePlayer.thrown) {
      const players = this.fetchOtherPlayers(activePlayer);
      players.forEach(otherPlayer => {
        // test for collision between the spear and a player
        if (testPolygonPolygon(activePlayer.spear.hitbox, otherPlayer.hitbox)) {
          activePlayer.resetSpear();
          otherPlayer.takeDamage(config.damageOnHit);

          // if the player hit is now dead
          if (!otherPlayer.checkStatus()) {
            activePlayer.increaseScore(config.scorePerKil);
            this.removePlayer(otherPlayer.id);
          }
        }
      });
    }
  }

  fetchPlayers(activePlayer) {
    // only include players within 2500 units of the current player
    // (this includes the current player)
    return this.players.filter(player => {
      const distance = getDistance(
        activePlayer.pos.x, player.pos.x,
        activePlayer.pos.y, player.pos.y,
      );
      return distance.total <= 2500;
    });
  }

  fetchOtherPlayers(activePlayer) {
    // only include players within 2500 units of the current player
    // (not including the current player)
    return this.players.filter(player => {
      const distance = getDistance(
        activePlayer.pos.x, player.pos.x,
        activePlayer.pos.y, player.pos.y,
      );
      return (distance.total <= 2500) && (player.id !== activePlayer.id);
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
