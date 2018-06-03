import React, { Component, createRef } from 'react';

import config from '../../config';
import assetManager from '../../AssetManager';

const { Stage, Bitmap, Shape, Text, Container } = window.createjs;

const { sprites, sounds, assets } = assetManager;

class Canvas extends Component {
  canvas = createRef();

  state = {
    pos: { x: 0, y: 0 },
    health: 100,
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
    // start game
    window.requestAnimationFrame(this.updateCycle);
  }

  componentWillUnmount() {
    this.mounted = false;
    window.cancelAnimationFrame(this.cycle);
    // cancel event listeners
    window.removeEventListener('click', this.throw);
    window.removeEventListener('keydown', this.throw);

    sounds.heartbeat.stop();
  }

  // the canvas component is not a normal React component and doesn't need to re-render
  shouldComponentUpdate = () => false;


  // set up Easel JS objects
  initEasel = () => {
    this.stage = new Stage(this.canvas.current);
    this.boundary = new Shape();
    this.warning = new Shape();
  }


  // scale to the current device
  resizeCanvas = () => {
    this.stage.canvas.width = Math.round(config.deviceWidth / config.scale);
    this.stage.canvas.height = Math.round(config.deviceHeight / config.scale);
  }


  // update cycle run every animation frame
  updateCycle = () => {
    if (!this.mounted) return;

    this.cycle = window.requestAnimationFrame(this.updateCycle);
    this.stage.removeAllChildren();

    this.target = {
      x: this.stage.mouseX + (this.state.pos.x - (this.stage.canvas.width / 2)),
      y: this.stage.mouseY + (this.state.pos.y - (this.stage.canvas.height / 2)),
    };

    this.props.socket.emit('requestUpdate', this.target, data => {
      this.setState({
        pos: data.player.pos,
        health: data.player.health,
        thrown: data.player.thrown,
      });

      this.drawBackground();
      this.drawBoundary();
      this.drawPlayers(data.players);

      // out of bounds
      if (data.player.outOfBounds) {
        if (!sounds.heartbeat.playing()) sounds.heartbeat.play();
        this.drawWarning(data.player.outOfBounds.time);
      } else sounds.heartbeat.pause();

      this.stage.update();
    });
  }


  throw = e => {
    // checks if the key was the spacebar and if the spear has already been thrown
    if ((e.key && e.key !== ' ') || this.state.thrown) return;

    this.props.socket.emit('throw', this.target);
    sounds.throw.play();
  }


  // draw all nearby players (including the current player), their spear, and their name
  drawPlayers = players => {
    const { stage } = this;
    const { pos } = this.state;

    // position of the top left corner of the canvas in the game
    const xOffset = pos.x - (stage.canvas.width / 2);
    const yOffset = pos.y - (stage.canvas.height / 2);

    players.forEach(player => {
      // player
      const playerBitmap = new Bitmap(sprites.player);
      playerBitmap.setBounds(0, 0, playerBitmap.image.width, playerBitmap.image.height);
      playerBitmap.regX = playerBitmap.getBounds().width / 2;
      playerBitmap.regY = playerBitmap.getBounds().height / 2;
      playerBitmap.x = player.pos.x - xOffset;
      playerBitmap.y = player.pos.y - yOffset;
      playerBitmap.rotation = (player.direction * (180 / Math.PI)) + 90;

      // spear
      const spearBitmap = new Bitmap(player.thrown ?
        sprites.spearReleased : sprites.spear);
      spearBitmap.setBounds(0, 0, spearBitmap.image.width, spearBitmap.image.height);
      spearBitmap.regX = spearBitmap.getBounds().width / 2;
      spearBitmap.regY = spearBitmap.getBounds().height / 2;
      spearBitmap.x = playerBitmap.x + player.distanceToSpear.x;
      spearBitmap.y = playerBitmap.y + player.distanceToSpear.y;
      spearBitmap.rotation = (player.spear.direction * (180 / Math.PI)) + 90;

      stage.addChild(playerBitmap, spearBitmap);

      // name tag
      if (player.name) {
        const name = new Text(player.name, '18px Roboto', 'white');
        const nameBackground = new Shape();
        const nameTag = new Container();
        nameTag.addChild(name);
        nameTag.addChild(nameBackground);

        name.textBaseline = 'middle';
        name.y = nameTag.getBounds().height / 2;
        nameBackground.graphics.clear();
        nameBackground.graphics.beginFill('rgba(0, 0, 0, 0.1)')
          .drawRect(-10, -5, nameTag.getBounds().width + 20, nameTag.getBounds().height + 10);
        nameTag.regX = nameTag.getBounds().width / 2;
        nameTag.x = playerBitmap.x;
        nameTag.y = playerBitmap.y + 75;

        stage.addChild(nameTag);
      }
    });
  }


  // draw background cells according to the player's position
  drawBackground = () => {
    const { stage } = this;
    const { pos } = this.state;

    const xNumOfCells = Math.ceil(stage.canvas.width / assets.background.width) + 1;
    const yNumOfCells = Math.ceil(stage.canvas.height / assets.background.height) + 1;

    const xOffset = pos.x % assets.background.width;
    const yOffset = pos.y % assets.background.height;

    for (let x = -xNumOfCells; x < xNumOfCells; x += 1) {
      for (let y = -yNumOfCells; y < yNumOfCells; y += 1) {
        const cell = new Bitmap(assets.background);
        cell.x = -xOffset + (x * cell.getBounds().width);
        cell.y = -yOffset + (y * cell.getBounds().height);
        stage.addChild(cell);
      }
    }
  }


  // draw the boundary ring
  drawBoundary = () => {
    const { boundary, stage } = this;
    const { pos } = this.state;

    boundary.x = stage.canvas.width / 2;
    boundary.y = stage.canvas.height / 2;

    boundary.graphics.clear();
    boundary.graphics.setStrokeStyle(10).beginStroke('rgba(255, 255, 255, 0.1)')
      .drawCircle(-pos.x, -pos.y, 5000);

    stage.addChild(boundary);
  }


  // gradually fade screen to black while out of bounds
  drawWarning = timeOutOfBounds => {
    const { stage, warning } = this;

    const alpha = timeOutOfBounds / 8;
    warning.graphics.clear();
    warning.graphics.beginFill(`rgba(0, 0, 0, ${alpha})`)
      .drawRect(0, 0, stage.canvas.width, stage.canvas.height);

    stage.addChild(warning);
  }


  render = () => <canvas ref={this.canvas} />;
}

export default Canvas;
