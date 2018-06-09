import React, { Component, createRef } from 'react';

import ArenaManager from './ArenaManager';
import PlayerManager from './PlayerManager';
import config from '../../../config';
import assetManager from '../../../services/assetManager';
import parser from '../../../services/parser';

const { Stage, Ticker } = window.createjs;
const { sounds } = assetManager;
const { encode, decode } = parser;

class Canvas extends Component {
  canvas = createRef();

  state = {
    pos: { x: 0, y: 0 },
  }

  componentDidMount() {
    this.mounted = true;

    window.addEventListener('click', this.throwSpear);
    window.addEventListener('keydown', this.throwSpear);
    window.addEventListener('resize', this.resizeCanvas);

    this.stage = new Stage(this.canvas.current);
    this.arenaManager = new ArenaManager();
    const { backgroundCells, boundary, boundaryWarning } = this.arenaManager;
    this.stage.addChild(backgroundCells, boundary, boundaryWarning);

    this.resizeCanvas();

    this.playerManagers = [];

    Ticker.timingMode = Ticker.RAF;
    Ticker.on('tick', this.tick);

    this.props.socket.addEventListener('message', ({ data }) => {
      const decoded = decode(data);
      if (decoded._type === 'update') this.update(decoded);
    });
    this.props.socket.addEventListener('close', Ticker.reset);
  }

  componentWillUnmount() {
    this.mounted = false;

    window.removeEventListener('click', this.throwSpear);
    window.removeEventListener('keydown', this.throwSpear);
    window.removeEventListener('resize', this.resizeCanvas);

    Ticker.reset();
    sounds.heartbeat.stop();
  }

  // component doesn't need to re-render
  shouldComponentUpdate = () => false;

  // scale to the current device
  resizeCanvas = () => {
    this.stage.canvas.width = Math.round(config.deviceWidth / config.scale);
    this.stage.canvas.height = Math.round(config.deviceHeight / config.scale);
  }

  // ticker
  tick = tick => {
    this.props.socket.send(encode('requestUpdate', { target: {
      x: this.stage.mouseX + (this.state.pos.x - (this.stage.canvas.width / 2)),
      y: this.stage.mouseY + (this.state.pos.y - (this.stage.canvas.height / 2)),
    } }));

    this.stage.update(tick);
  }

  // server has provided game data
  update = ({ players }) => {
    const { mounted, stage, arenaManager } = this;
    const { pos } = this.state;

    if (!mounted) return;

    const activePlayer = players.find(player => player.id === this.props.socket.id);

    this.setState({
      pos: activePlayer.pos,
      thrown: activePlayer.thrown,
      dead: activePlayer.dead,
    });

    if (activePlayer.outOfBounds.time > 0 && !sounds.heartbeat.playing()) sounds.heartbeat.play();
    else sounds.heartbeat.pause();

    // update the background, boundary, and boundary warning
    arenaManager.update(stage.canvas, pos, activePlayer.outOfBounds.time);

    // remove managers for players who are no longer on screen
    this.playerManagers.forEach(manager => {
      // if a player has the same id as this manager leave it alone
      if (players.some(player => player.id === manager.id)) return;
      // otherwise...
      // remove it from the stage
      stage.removeChildAt(stage.children.indexOf(manager.container));
      // remove it from playerManagers
      this.playerManagers = this.playerManagers.filter(mngr => mngr.id !== manager.id);
    });

    // find the player container for each player or create a new one
    players.forEach(player => {
      let manager = this.playerManagers.find(mngr => mngr.id === player.id);
      if (!manager) {
        manager = new PlayerManager(player.id, player.name);
        this.playerManagers.push(manager);
        stage.addChild(manager.container);
      }

      const offset = {
        x: pos.x - (stage.canvas.width / 2),
        y: pos.y - (stage.canvas.height / 2),
      };

      manager.update(player, offset);
    });

    // find this client's player and wait for the disintegration animation
    const thisManager = this.playerManagers.find(mngr => mngr.id === this.props.socket.id);
    thisManager.playerSprite.on('animationend', e => {
      if (e.name === 'disintegrate') this.props.socket.send(encode('removePlayer'));
    });
  }

  throwSpear = e => {
    // checks the key, if the spear has been thrown, and if the player is dead
    if ((e.key && e.key !== ' ') || this.state.thrown || this.state.dead) return;
    this.props.socket.send(encode('throw', { target: {
      x: this.stage.mouseX + (this.state.pos.x - (this.stage.canvas.width / 2)),
      y: this.stage.mouseY + (this.state.pos.y - (this.stage.canvas.height / 2)),
    } }));
    sounds.throw.play();
  }

  render = () => <canvas ref={this.canvas} />;
}

export default Canvas;
