import _ from 'lodash';
import * as PIXI from 'pixi.js';

import assetManager from '../../../assetManager';

class ScorePickupManager {
  constructor(id, pos) {
    this.id = id;
    this.pos = pos;

    // choose a random pick-up texture from the 3
    const options = assetManager.textures;
    const texture = _.sample([
      options['score-pickup_1'], options['score-pickup_2'], options['score-pickup_3'],
    ]);

    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5, 0.5);

    // fluctuate opacity
    let alphaVariation = 0.01;
    setInterval(() => {
      this.sprite.alpha -= alphaVariation;
      if (this.sprite.alpha < 0.5 || this.sprite.alpha === 1) alphaVariation *= -1;
    }, _.random(10, 20));
  }

  hide = () => {
    this.sprite.visible = false;
  }

  show = () => {
    this.sprite.visible = true;
  }

  update = offset => {
    this.sprite.position.set(this.pos.x - offset.x, this.pos.y - offset.y);
  }
}

export default ScorePickupManager;
