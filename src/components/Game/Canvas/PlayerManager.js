import assetManager from '../../../services/assetManager';

const { Container, Sprite, Shape, Text } = window.createjs;
const { spritesheets } = assetManager;

// manages the player sprite, spear sprite, and name tag
class PlayerManager {
  constructor(id, name) {
    this.id = id;

    this.container = new Container();
    this.playerSprite = new Sprite(spritesheets.player, 'still');
    this.spearSprite = new Sprite(spritesheets.spear, 'holding');

    if (name) {
      this.nameTag = new Container();
      this.name = new Text(name, '18px Roboto', 'white');
      this.name.textBaseline = 'middle';
      this.nameBackground = new Shape();
      this.nameTag.addChild(this.name, this.nameBackground);

      this.name.y = this.nameTag.getBounds().height / 2;
      this.nameBackground.graphics.beginFill('rgba(0, 0, 0, 0.1)')
        .drawRect(
          -10, -5,
          this.nameTag.getBounds().width + 20, this.nameTag.getBounds().height + 10,
        );
      this.nameTag.regX = this.nameTag.getBounds().width / 2;
    }

    this.container.addChild(this.playerSprite, this.spearSprite);
    if (this.nameTag) this.container.addChild(this.nameTag);
  }

  // update the position of the player, including its spear and name tag
  update = (player, offset) => {
    const { container, playerSprite, spearSprite, nameTag } = this;

    playerSprite.x = player.pos.x - offset.x;
    playerSprite.y = player.pos.y - offset.y;
    playerSprite.rotation = (player.direction * (180 / Math.PI)) + 90;

    if (player.dead && (playerSprite.currentAnimation !== 'disintegrate')) {
      container.removeChild(spearSprite, nameTag);
      playerSprite.gotoAndPlay('disintegrate');
    } else if (player.quick && (playerSprite.currentAnimation === 'still')) {
      playerSprite.gotoAndPlay('moving');
    } else if (!player.quick && !player.dead) playerSprite.gotoAndStop('still');

    spearSprite.x = playerSprite.x + player.distanceToSpear.x;
    spearSprite.y = playerSprite.y + player.distanceToSpear.y;
    spearSprite.rotation = (player.spear.direction * (180 / Math.PI)) + 90;

    if (player.thrown && (spearSprite.currentAnimation !== 'flying')) {
      spearSprite.gotoAndPlay('flying');
    } else if (!player.thrown) spearSprite.gotoAndStop('holding');

    if (nameTag) {
      nameTag.x = playerSprite.x;
      nameTag.y = playerSprite.y + 75;
    }
  }
}

export default PlayerManager;
