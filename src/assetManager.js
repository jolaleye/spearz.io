import * as PIXI from 'pixi.js';

import backgroundCell from './assets/background-cell.png';
import spriteAtlas from './assets/spritesheet.json';
import spritesheet from './assets/spritesheet.png';

class AssetManager {
  constructor() {
    this.textures = {};
  }

  load = () => new Promise(resolve => {
    PIXI.loader.add([backgroundCell, spritesheet]).load(() => {
      const { resources } = PIXI.loader;

      this.textures.backgroundCell = resources[backgroundCell].texture;

      const sprites = new PIXI.Spritesheet(resources[spritesheet].texture.baseTexture, spriteAtlas);
      sprites.parse(textures => {
        this.textures = { ...this.textures, ...textures };
      });

      resolve();
    });
  });
}

export default new AssetManager();
