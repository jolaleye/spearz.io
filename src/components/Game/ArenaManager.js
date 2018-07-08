import * as PIXI from 'pixi.js';

import assetManager from '../../assetManager';

class ArenaManager {
  constructor(screen) {
    // background cell
    const cellTexture = assetManager.textures.backgroundCell;
    this.background = new PIXI.extras.TilingSprite(cellTexture, screen.width, screen.height);
  }

  resize = screen => {
    this.background.width = screen.width;
    this.background.height = screen.height;
  }
}

export default ArenaManager;
