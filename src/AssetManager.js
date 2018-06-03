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
    this.queue = new LoadQueue(false);
    this.queue.on('fileload', this.handleLoad, this);

    this.misc = {};

    this.spritesheets = {
      spear: new SpriteSheet({
        images: [spear],
        frames: { width: 18, height: 106, regX: 9, regY: 53, spacing: 5 },
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
    this.queue.loadManifest([
      { id: 'background', src: background },
    ]);

    return new Promise((resolve, reject) => {
      this.queue.on('complete', resolve, this);
      this.queue.on('error', reject, this);
    });
  }

  handleLoad = e => {
    this.misc[e.item.id] = e.result;
  }
}

export default new AssetManager();
