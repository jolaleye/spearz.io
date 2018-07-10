class Spear {
  constructor(pos) {
    this.pos = { x: pos.x, y: pos.y };
    this.direction = 0;
  }

  // data needed for the quadtree   values match the sprite
  get qt() {
    return { x: this.pos.x, y: this.pos.y - 45.5, width: 18, height: 15 };
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
