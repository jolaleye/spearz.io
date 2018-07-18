import * as PIXI from 'pixi.js';

import config from './config';
import assetManager from '../../../assetManager';

class ArenaManager {
  constructor(screen) {
    this.screen = screen;

    // background cell
    const cellTexture = assetManager.textures.backgroundCell;
    this.background = new PIXI.extras.TilingSprite(cellTexture, screen.width, screen.height);

    // boundary ring
    this.boundary = new PIXI.Graphics();
    this.boundary.lineStyle(10, 0xFFFFFF, 0.1, 0.5);
    this.boundary.drawCircle(0, 0, config.arenaRadius);
  }

  resize = () => {
    this.background.width = this.screen.width;
    this.background.height = this.screen.height;
  }

  update = offset => {
    this.background.tilePosition.set(-offset.x, -offset.y);
    this.boundary.position.set(-offset.x, -offset.y);
  }
}

export default ArenaManager;
