import React, { Component, createRef } from 'react';

import config from '../../../config';
import assetManager from '../../../AssetManager';
import PlayerContainer from './PlayerContainer';

const { Stage, Bitmap, Shape, Container, Ticker } = window.createjs;

const { sounds } = assetManager;

class Canvas extends Component {
  canvas = createRef();

  state = {
    pos: { x: 0, y: 0 },
    thrown: false,
  }

  componentDidMount() {
    this.mounted = true;
    // add event listeners
    window.addEventListener('click', this.throw);
    window.addEventListener('keydown', this.throw);
    // initialize
    this.initEasel();
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas);
    // canvas counterparts to players
    this.playerContainers = [];
    // start game
    Ticker.timingMode = Ticker.RAF;
    Ticker.on('tick', this.updateCycle);
  }

  componentWillUnmount() {
    this.mounted = false;
    Ticker.reset();
    sounds.heartbeat.stop();
    window.removeEventListener('click', this.throw);
    window.removeEventListener('keydown', this.throw);
  }

  // the canvas component is not a normal React component and doesn't need to re-render
  shouldComponentUpdate = () => false;

  // set up Easel JS objects
  initEasel = () => {
    this.stage = new Stage(this.canvas.current);

    this.boundary = new Shape();
    this.warning = new Shape();
    this.bgContainer = new Container();
    this.bgCell = new Bitmap(assetManager.assets.getResult('background'));

    this.stage.addChild(this.bgContainer);
    this.stage.addChild(this.boundary);
    this.stage.addChild(this.warning);
  }

  // scale to the current device
  resizeCanvas = () => {
    this.stage.canvas.width = Math.round(config.deviceWidth / config.scale);
    this.stage.canvas.height = Math.round(config.deviceHeight / config.scale);
  }

  // update cycle run every animation frame
  updateCycle = event => {
    const { stage, mounted } = this;

    this.target = {
      x: stage.mouseX + (this.state.pos.x - (stage.canvas.width / 2)),
      y: stage.mouseY + (this.state.pos.y - (stage.canvas.height / 2)),
    };

    this.props.socket.emit('requestUpdate', this.target, data => {
      if (!mounted) return;

      this.setState({
        pos: data.player.pos,
        thrown: data.player.thrown,
      });

      this.boundary.graphics.clear();
      this.warning.graphics.clear();

      this.drawBackground();
      this.drawBoundary();
      this.updatePlayers(data.players);

      if (data.player.outOfBounds) {
        if (!sounds.heartbeat.playing()) sounds.heartbeat.play();
        this.drawWarning(data.player.outOfBounds.time);
      } else sounds.heartbeat.pause();

      stage.update(event);
    });
  }

  throw = e => {
    // checks if the key was the spacebar and if the spear has already been thrown
    if ((e.key && e.key !== ' ') || this.state.thrown) return;
    this.props.socket.emit('throw', this.target);
    sounds.throw.play();
  }

  // update each player's components
  updatePlayers = players => {
    const { stage } = this;
    const { pos } = this.state;

    // remove player containers for players who are no longer on screen
    this.playerContainers.forEach(container => {
      // if a player has the same id as this container leave it alone
      if (players.some(player => player.id === container.id)) return;

      // remove it from the stage
      const index = container.container.parent.children.indexOf(container.container);
      container.container.parent.removeChildAt(index);
      // remove it from playerContainers
      this.playerContainers = this.playerContainers.filter(playerContainer => (
        playerContainer.id !== container.id
      ));
    });

    // find the player container for each player or create a new one
    players.forEach(player => {
      let playerContainer = this.playerContainers.find(container => container.id === player.id);
      if (!playerContainer) {
        playerContainer = new PlayerContainer(player.id, player.name);
        this.playerContainers.push(playerContainer);
      }

      const offset = {
        x: pos.x - (stage.canvas.width / 2),
        y: pos.y - (stage.canvas.height / 2),
      };

      playerContainer.update(player, offset);

      stage.addChild(playerContainer.container);
    });
  }

  // draw background cells according to the player's position
  drawBackground = () => {
    const { stage, bgContainer, bgCell } = this;
    const { pos } = this.state;

    const xNumOfCells = Math.ceil(stage.canvas.width / bgCell.image.width) + 1;
    const yNumOfCells = Math.ceil(stage.canvas.height / bgCell.image.height) + 1;

    const xOffset = pos.x % bgCell.image.width;
    const yOffset = pos.y % bgCell.image.height;

    bgContainer.removeAllChildren();

    for (let x = -xNumOfCells; x < xNumOfCells; x += 1) {
      for (let y = -yNumOfCells; y < yNumOfCells; y += 1) {
        const cell = bgCell.clone();
        cell.x = -xOffset + (x * cell.getBounds().width);
        cell.y = -yOffset + (y * cell.getBounds().height);
        bgContainer.addChild(cell);
      }
    }
  }

  // draw the boundary ring
  drawBoundary = () => {
    const { boundary, stage } = this;
    const { pos } = this.state;

    boundary.x = stage.canvas.width / 2;
    boundary.y = stage.canvas.height / 2;

    boundary.graphics.setStrokeStyle(10).beginStroke('rgba(255, 255, 255, 0.1)')
      .drawCircle(-pos.x, -pos.y, 5000);
  }

  // gradually fade screen to black while out of bounds
  drawWarning = timeOutOfBounds => {
    const { stage, warning } = this;

    const alpha = timeOutOfBounds / 8;
    warning.graphics.beginFill(`rgba(0, 0, 0, ${alpha})`)
      .drawRect(0, 0, stage.canvas.width, stage.canvas.height);
  }

  render = () => <canvas ref={this.canvas} />;
}

export default Canvas;