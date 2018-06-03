import React, { Component, createRef } from 'react';

import config from '../../config';
import assetManager from '../../AssetManager';

const { Stage, Bitmap, Shape, Text, Container, Sprite, Ticker } = window.createjs;

const { sprites, spritesheets, sounds } = assetManager;

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
    this.bgcell = new Bitmap(assetManager.misc.background);

    this.player = new Bitmap(sprites.player);
    this.player.regX = 44;
    this.player.regY = 40;
    this.spear = new Sprite(spritesheets.spear, 0);

    this.nameTag = new Container();
    this.name = new Text(null, '18px Roboto', 'white');
    this.nameBackground = new Shape();
  }


  // scale to the current device
  resizeCanvas = () => {
    this.stage.canvas.width = Math.round(config.deviceWidth / config.scale);
    this.stage.canvas.height = Math.round(config.deviceHeight / config.scale);
  }


  // update cycle run every animation frame
  updateCycle = event => {
    this.stage.removeAllChildren();

    this.target = {
      x: this.stage.mouseX + (this.state.pos.x - (this.stage.canvas.width / 2)),
      y: this.stage.mouseY + (this.state.pos.y - (this.stage.canvas.height / 2)),
    };

    this.props.socket.emit('requestUpdate', this.target, data => {
      if (this.mounted) {
        this.setState({
          pos: data.player.pos,
          health: data.player.health,
          thrown: data.player.thrown,
        });
      }

      this.drawBackground();
      this.drawBoundary();
      this.drawPlayers(data.players);

      // out of bounds
      if (data.player.outOfBounds) {
        if (!sounds.heartbeat.playing()) sounds.heartbeat.play();
        this.drawWarning(data.player.outOfBounds.time);
      } else sounds.heartbeat.pause();

      this.stage.update(event);
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
      const playerSprite = this.player.clone();
      playerSprite.x = player.pos.x - xOffset;
      playerSprite.y = player.pos.y - yOffset;
      playerSprite.rotation = (player.direction * (180 / Math.PI)) + 90;

      const spearSprite = this.spear.clone();
      spearSprite.gotoAndStop(player.thrown ? 1 : 0);
      spearSprite.x = playerSprite.x + player.distanceToSpear.x;
      spearSprite.y = playerSprite.y + player.distanceToSpear.y;
      spearSprite.rotation = (player.spear.direction * (180 / Math.PI)) + 90;

      stage.addChild(playerSprite, spearSprite);

      // name tag
      if (player.name) {
        const name = this.name.clone();
        const nameBackground = this.nameBackground.clone();
        const nameTag = this.nameTag.clone();
        nameTag.addChild(name);
        nameTag.addChild(nameBackground);

        name.text = player.name;
        name.textBaseline = 'middle';
        name.y = nameTag.getBounds().height / 2;
        nameBackground.graphics.clear();
        nameBackground.graphics.beginFill('rgba(0, 0, 0, 0.1)')
          .drawRect(-10, -5, nameTag.getBounds().width + 20, nameTag.getBounds().height + 10);
        nameTag.regX = nameTag.getBounds().width / 2;
        nameTag.x = playerSprite.x;
        nameTag.y = playerSprite.y + 75;

        nameTag.cache(-5, -5, nameTag.getBounds().width + 10, nameTag.getBounds().height + 10);
        stage.addChild(nameTag);
      }
    });
  }


  // draw background cells according to the player's position
  drawBackground = () => {
    const { stage } = this;
    const { pos } = this.state;
    const { background } = assetManager.misc;

    const xNumOfCells = Math.ceil(stage.canvas.width / background.width) + 1;
    const yNumOfCells = Math.ceil(stage.canvas.height / background.height) + 1;

    const xOffset = pos.x % background.width;
    const yOffset = pos.y % background.height;

    for (let x = -xNumOfCells; x < xNumOfCells; x += 1) {
      for (let y = -yNumOfCells; y < yNumOfCells; y += 1) {
        const cell = this.bgcell.clone();
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
