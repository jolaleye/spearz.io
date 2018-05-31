const { testPolygonPolygon } = require('sat');

const { id, getDistance } = require('./util');

class Room {
  constructor() {
    this.id = id();
    this.players = [];
  }

  fetchPlayers(currentPlayer) {
    // only include players within 2500 units of the current player
    // (this includes the current player)
    return this.players.filter(player => {
      const distance = getDistance(
        currentPlayer.pos.x, player.pos.x,
        currentPlayer.pos.y, player.pos.y,
      );
      return distance.total <= 2500;
    });
  }

  fetchOtherPlayers(currentPlayer) {
    // only include players within 2500 units of the current player
    // (not including the current player)
    return this.players.filter(player => {
      const distance = getDistance(
        currentPlayer.pos.x, player.pos.x,
        currentPlayer.pos.y, player.pos.y,
      );
      return (distance.total <= 2500) && (player.id !== currentPlayer.id);
    });
  }

  checkForHits(currentPlayer) {
    const players = this.fetchOtherPlayers(currentPlayer);
    players.forEach(otherPlayer => {
      // test for collision between the spear and a player
      if (testPolygonPolygon(currentPlayer.spear.hitbox, otherPlayer.hitbox)) {
        currentPlayer.resetSpear();
        otherPlayer.takeHit(25);

        // if the player is now dead, remove them from the room
        if (!otherPlayer.checkStatus()) {
          this.players = this.players.filter(player => player.id !== otherPlayer.id);
        }
      }
    });
  }
}

module.exports = Room;
