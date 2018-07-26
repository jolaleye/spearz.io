import * as PIXI from 'pixi.js';
import { Howl } from 'howler';

import backgroundCell from './assets/background-cell.png';
import spriteAtlas from './assets/spritesheet.json';
import spritesheet from './assets/spritesheet.png';
import messageBg from './assets/message-area.svg';
import cursor from './assets/cursor.png';

import soundtrack from './assets/soundtrack.webm';
import throwSFX from './assets/throw.webm';
import hitSFX from './assets/hit.webm';
import boundsSFX from './assets/bounds.webm';

class AssetManager {
  constructor() {
    this.textures = {};
    this.sounds = {};
  }

  load = async () => {
    this.loadSounds();
    await this.loadImages();
    console.log('Assets loaded');
  }

  loadImages = () => new Promise(resolve => {
    PIXI.loader.add([backgroundCell, spritesheet, messageBg, cursor]).load(() => {
      const { resources } = PIXI.loader;

      this.textures.backgroundCell = resources[backgroundCell].texture;

      const sprites = new PIXI.Spritesheet(resources[spritesheet].texture.baseTexture, spriteAtlas);
      sprites.parse(textures => {
        this.textures = { ...this.textures, ...textures };
      });

      resolve();
    });
  });

  loadSounds = () => {
    this.sounds.soundtrack = new Howl({ src: [soundtrack], loop: true, volume: 0.5 });

    this.sounds.throw = new Howl({ src: [throwSFX], volume: 0.5 });

    this.sounds.hit = new Howl({ src: [hitSFX], volume: 0.4 });

    this.sounds.bounds = new Howl({ src: [boundsSFX], loop: true });
  }
}

export default new AssetManager();
