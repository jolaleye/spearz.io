import { Howl } from 'howler';

import background from './assets/bg-cell.png';
import player from './assets/player.png';
import spear from './assets/spear.png';
import heartbeat from './assets/heartbeat.wav';
import hit from './assets/hit.wav';
import soundtrack from './assets/soundtrack.mp3';
import throwSFX from './assets/throw.wav';

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
    };

    this.sprites = { player };

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
