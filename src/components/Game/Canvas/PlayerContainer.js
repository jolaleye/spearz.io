import assetManager from '../../../AssetManager';

const { Bitmap, Sprite, Container, Shape, Text } = window.createjs;

const { sprites, spritesheets } = assetManager;

class PlayerContainer {
  constructor(id, name) {
    this.id = id;
    this.container = new Container();

    this.playerSprite = new Bitmap(sprites.player);
    this.playerSprite.regX = 44;
    this.playerSprite.regY = 40;

    this.spearSprite = new Sprite(spritesheets.spear);

    if (name) {
      this.nameTag = new Container();
      this.name = new Text(name, '18px Roboto', 'white');
      this.name.textBaseline = 'middle';
      this.nameBackground = new Shape();
      this.nameTag.addChild(this.name, this.nameBackground);
      this.name.y = this.nameTag.getBounds().height / 2;
      this.nameBackground.graphics.beginFill('rgba(0, 0, 0, 0.1)').drawRect(
        -10, -5,
        this.nameTag.getBounds().width + 20, this.nameTag.getBounds().height + 10,
      );
      this.nameTag.regX = this.nameTag.getBounds().width / 2;
    }

    this.container.addChild(this.playerSprite, this.spearSprite);
    if (this.nameTag) this.container.addChild(this.nameTag);
  }

  update = (player, offset) => {
    const { playerSprite, spearSprite, nameTag } = this;

    playerSprite.x = player.pos.x - offset.x;
    playerSprite.y = player.pos.y - offset.y;
    playerSprite.rotation = (player.direction * (180 / Math.PI)) + 90;

    spearSprite.x = playerSprite.x + player.distanceToSpear.x;
    spearSprite.y = playerSprite.y + player.distanceToSpear.y;
    spearSprite.rotation = (player.spear.direction * (180 / Math.PI)) + 90;
    spearSprite.gotoAndStop(player.thrown ? 1 : 0);

    if (nameTag) {
      nameTag.x = playerSprite.x;
      nameTag.y = playerSprite.y + 75;
    }
  }
}

export default PlayerContainer;
