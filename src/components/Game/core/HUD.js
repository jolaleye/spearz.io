import * as PIXI from 'pixi.js';

import { unpack } from '../../../services/cereal';

class HUD {
  constructor(app, socket) {
    socket.addEventListener('message', packet => {
      if (packet.data === 'ping') return;
      const data = unpack(packet.data);
      switch (data._) {
        case 'score':
          this.showScore(data.value);
          break;

        default: break;
      }
    });

    this.app = app;
  }

  showScore = value => {
    const score = new PIXI.Text(`+ ${value}`, {
      fill: 'white', fontFamily: 'Poppins', fontSize: 20, fontWeight: '400',
    });
    score.anchor.set(0.5, 0.5);
    score.position.set((this.app.screen.width / 2) + 90, (this.app.screen.height / 2) - 40);

    this.app.stage.addChild(score);

    // fade out the score popup
    setInterval(() => {
      score.alpha -= 0.01;
      score.position.y -= 0.2;
      if (score.alpha < 0.05) this.app.stage.removeChild(score);
    }, 30);
  }
}

export default HUD;
