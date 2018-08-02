import * as PIXI from 'pixi.js';

import { unpack } from '../../../services/cereal';
import { getDistance } from './util';

class HUD {
  constructor(app, socket) {
    socket.addEventListener('message', packet => {
      const data = unpack(packet.data);
      switch (data._) {
        case 'score':
          this.showScore(data.value);
          break;

        case 'map':
          this.updateMinimap(data.players, data.current);
          break;

        default: break;
      }
    });

    this.app = app;

    this.minimap = new PIXI.Graphics();
    this.minimap.beginFill(0x000, 0.15).drawCircle(0, 0, 102);
    this.minimap.position.set(110, 110);
    this.app.stage.addChild(this.minimap);

    const point = new PIXI.Graphics();
    point.beginFill(0xF5437E).drawCircle(0, 0, 2);
    this.mapPoint = this.app.renderer.generateTexture(point);

    this.currentPlayer = new PIXI.Graphics();
    this.currentPlayer.beginFill(0xFEE6CA).drawCircle(0, 0, 2).endFill();
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

  updateMinimap(players, currentPlayer) {
    this.minimap.removeChildren();

    // show other players
    players.forEach(player => {
      const current = getDistance(player.x, currentPlayer.x, player.y, currentPlayer.y).total === 0;
      const outOfBounds = getDistance(player.x, 0, player.y, 0).total >= 100;
      if (current || outOfBounds) return;

      const point = new PIXI.Sprite(this.mapPoint);
      point.anchor.set(0.5, 0.5);
      point.position.set(player.x, player.y);
      this.minimap.addChild(point);
    });

    // show current player
    this.currentPlayer.position.set(currentPlayer.x, currentPlayer.y);
    this.minimap.addChild(this.currentPlayer);
  }
}

export default HUD;
