import * as PIXI from 'pixi.js';

import assetManager from '../../assetManager';
import config from './config';

class ArenaManager {
  constructor(screen) {
    // background cell
    const cellTexture = assetManager.textures.backgroundCell;
    this.background = new PIXI.extras.TilingSprite(cellTexture, screen.width, screen.height);

    // boundary ring
    this.boundary = new PIXI.Graphics();
    this.boundary.lineStyle(10, 0xFFFFFF, 0.1, 0.5);
    this.boundary.drawCircle(0, 0, config.arenaRadius);
  }

  resize = screen => {
    this.background.width = screen.width;
    this.background.height = screen.height;
  }

  updateBackground = pos => {
    this.background.tilePosition.set(-pos.x, -pos.y);
  }

  updateBoundary = (pos, screen) => {
    const x = pos.x - (screen.width / 2);
    const y = pos.y - (screen.height / 2);
    this.boundary.position.set(-x, -y);
  }
}

export default ArenaManager;
