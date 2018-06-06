import { Howl } from 'howler';

import background from './assets/bg-cell.png';
import player from './assets/player.png';
import spear from './assets/spear.png';
import heartbeat from './assets/heartbeat.mp3';
import hit from './assets/hit.mp3';
import soundtrack from './assets/soundtrack.mp3';
import throwSFX from './assets/throw.mp3';

const { LoadQueue, SpriteSheet } = window.createjs;

class AssetManager {
  constructor() {
    this.assets = new LoadQueue(false);

    this.misc = {};

    this.spritesheets = {
      spear: new SpriteSheet({
        images: [spear],
        frames: { width: 20, height: 120, regX: 10, regY: 60, spacing: 5 },
        animations: {
          holding: 0,
          flying: {
            frames: [1, 2, 3, 4, 5, 4, 3, 2],
            speed: 0.1,
          },
        },
      }),
      player: new SpriteSheet({
        images: [player],
        frames: { width: 150, height: 150, regX: 75, regY: 46, spacing: 5 },
        animations: {
          still: 0,
          moving: {
            frames: [1, 2, 3, 2],
            speed: 0.1,
          },
          disintegrate: [4, 11, null, 0.1],
        },
      }),
    };

    this.sounds = {
      heartbeat: new Howl({ src: heartbeat }),
      hit: new Howl({ src: hit, volume: 0.2 }),
      soundtrack: new Howl({ src: soundtrack, loop: true, volume: 0.2 }),
      throw: new Howl({ src: throwSFX, volume: 0.2 }),
    };
  }

  loadAssets = () => {
    this.assets.loadManifest([
      { id: 'background', src: background },
    ]);

    return new Promise((resolve, reject) => {
      this.assets.on('complete', resolve, this);
      this.assets.on('error', reject, this);
    });
  }
}

export default new AssetManager();
