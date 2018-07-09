class Spear {
  constructor(pos) {
    this.pos = { x: pos.x, y: pos.y };
    this.direction = 0;
  }

  // follow the player's position
  follow(playerPos, playerDirection) {
    // angle from player to spear
    const angle = playerDirection + (Math.PI / 2);

    this.pos.x = playerPos.x + (55 * Math.cos(angle));
    this.pos.y = playerPos.y + (55 * Math.sin(angle));
    this.direction = playerDirection;
  }
}

module.exports = Spear;
