import React, { Component, createRef } from 'react';

import config from '../../config';
import playerSprite from '../../assets/player.png';
import spearSprite from '../../assets/spear.png';
import spearSpriteReleased from '../../assets/spear-released.png';

const { Stage, Bitmap, Shape, Text, Container } = window.createjs;

class Canvas extends Component {
  canvas = createRef();

  state = {
    pos: { x: 0, y: 0 },
  }

  componentDidMount() {
    this.initEasel();
    // add event listeners
    window.addEventListener('click', this.throw);
    window.addEventListener('keydown', this.throw);
    // initialize the canvas
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas);
    // start game cycle
    window.requestAnimationFrame(this.updateCycle);
  }

  componentWillUnmount() {
    window.cancelAnimationFrame(this.cycle);
    window.removeEventListener('click', this.throw);
    window.removeEventListener('keydown', this.throw);
  }


  // SET UP EASEL JS OBJECTS
  initEasel = () => {
    this.stage = new Stage(this.canvas.current);
    this.boundary = new Shape();
    this.warning = new Shape();
  }


  // SCALE TO THE CURRENT DEVICE
  resizeCanvas = () => {
    this.stage.canvas.width = Math.round(config.deviceWidth / config.scale);
    this.stage.canvas.height = Math.round(config.deviceHeight / config.scale);
  }


  updateCycle = () => {
    this.cycle = window.requestAnimationFrame(this.updateCycle);
    this.stage.removeAllChildren();

    this.target = {
      x: this.stage.mouseX + (this.state.pos.x - (this.stage.canvas.width / 2)),
      y: this.stage.mouseY + (this.state.pos.y - (this.stage.canvas.height / 2)),
    };

    this.props.socket.emit('requestUpdate', this.target, data => {
      this.setState({ pos: data.player.pos });

      this.drawBackground();
      this.drawBoundary();
      this.drawWarning(data.player.outOfBounds ? data.player.outOfBounds.time : 0);
      this.drawPlayers(data.players);

      this.stage.update();
    });
  }


  throw = e => {
    if (e.key && e.key !== ' ') return;
    this.props.socket.emit('throw', this.target);
  }


  // DRAW PLAYERS, THEIR SPEAR, AND THEIR NAME
  drawPlayers = players => {
    const { stage } = this;
    const { pos } = this.state;

    // position of the top left corner of the canvas in the game
    const xOffset = pos.x - (stage.canvas.width / 2);
    const yOffset = pos.y - (stage.canvas.height / 2);

    players.forEach(player => {
      // player
      const playerBitmap = new Bitmap(playerSprite);
      playerBitmap.setBounds(0, 0, playerBitmap.image.width, playerBitmap.image.height);
      playerBitmap.regX = playerBitmap.getBounds().width / 2;
      playerBitmap.regY = playerBitmap.getBounds().height / 2;
      playerBitmap.x = player.pos.x - xOffset;
      playerBitmap.y = player.pos.y - yOffset;
      playerBitmap.rotation = (player.direction * (180 / Math.PI)) + 90;

      // spear
      const spearBitmap = new Bitmap(player.thrown ? spearSpriteReleased : spearSprite);
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


  // DRAW BACKGROUND CELLS AROUND THE PLAYER'S POSITION
  drawBackground = () => {
    const { stage } = this;
    const { pos } = this.state;
    const { backgroundCell } = this.props.assets;

    const xNumOfCells = Math.ceil(stage.canvas.width / backgroundCell.width) + 1;
    const yNumOfCells = Math.ceil(stage.canvas.height / backgroundCell.height) + 1;

    const xOffset = pos.x % backgroundCell.width;
    const yOffset = pos.y % backgroundCell.height;

    for (let x = -xNumOfCells; x < xNumOfCells; x += 1) {
      for (let y = -yNumOfCells; y < yNumOfCells; y += 1) {
        const cell = new Bitmap(backgroundCell);
        cell.x = -xOffset + (x * cell.getBounds().width);
        cell.y = -yOffset + (y * cell.getBounds().height);
        stage.addChild(cell);
      }
    }
  }


  // DRAW THE BOUNDARY CIRCLE
  drawBoundary = () => {
    const { boundary, stage } = this;
    const { pos } = this.state;

    boundary.x = stage.canvas.width / 2;
    boundary.y = stage.canvas.height / 2;

    boundary.graphics.clear();
    boundary.graphics.setStrokeStyle(10).beginStroke('rgba(255, 255, 255, 0.1)')
      .drawCircle(-pos.x, -pos.y, 5500);

    stage.addChild(boundary);
  }


  // DRAW WARNING PULSES WHILE OUT OF BOUNDS
  drawWarning = timeOutOfBounds => {
    const { stage, warning } = this;

    if (timeOutOfBounds === 0) return;
    const alpha = Math.min(`.${timeOutOfBounds.toString().split('.')[1].slice(0, 3)}`, 0.8);

    warning.graphics.clear();
    warning.graphics.beginRadialGradientFill(
      ['transparent', `rgba(189, 75, 104, ${alpha})`], [0.7, 1],
      stage.canvas.width / 2, stage.canvas.height / 2, 0,
      stage.canvas.width / 2, stage.canvas.height / 2, 900,
    ).drawRect(0, 0, stage.canvas.width, stage.canvas.height);

    stage.addChild(warning);
  }


  render = () => <canvas ref={this.canvas} />;
}

export default Canvas;
