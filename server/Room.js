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
}

module.exports = Room;
