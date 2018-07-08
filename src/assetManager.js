import { loader } from 'pixi.js';

import backgroundCell from './assets/background-cell.png';

class AssetManager {
  constructor() {
    this.textures = {};
  }

  load = () => new Promise(resolve => {
    loader.add(backgroundCell).load(() => {
      this.textures.backgroundCell = loader.resources[backgroundCell].texture;
      resolve();
    });
  });
}

export default new AssetManager();
