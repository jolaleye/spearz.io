const { id, getDistance } = require('./util');

class Room {
  constructor() {
    this.id = id();
    this.players = [];
  }

  fetchOtherPlayers(currentPlayer) {
    // exclude the current player
    const otherPlayers = this.players.filter(player => player.id !== currentPlayer.id);
    // only include players within 2500 units of the current player
    const nearbyPlayers = otherPlayers.filter(player => {
      const distance = getDistance(
        currentPlayer.pos.x, player.pos.x,
        currentPlayer.pos.y, player.pos.y,
      );
      return distance.total <= 2500;
    });

    return nearbyPlayers;
  }
}

module.exports = Room;
