import React, { Component, createRef } from 'react';

import config from '../../config';
import playerSprite from '../../assets/player.png';
import spearSprite from '../../assets/spear.png';

const { Stage, Bitmap, Shape, Text, Container } = window.createjs;

class Canvas extends Component {
  canvas = createRef();

  state = {
    pos: { x: 0, y: 0 },
  }

  componentDidMount() {
    this.initEasel();
    // initialize the canvas
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas);
    // start game cycle
    window.requestAnimationFrame(this.updateCycle);
  }


  // SET UP EASEL JS OBJECTS
  initEasel = () => {
    this.stage = new Stage(this.canvas.current);
    this.playerBitmap = new Bitmap(playerSprite);
    this.spearBitmap = new Bitmap(spearSprite);
    this.boundary = new Shape();
    this.warning = new Shape();

    this.name = new Text(null, '18px Roboto', 'white');
    this.name.textBaseline = 'middle';
    this.nameBackground = new Shape();
    this.nameTag = new Container();
    this.nameTag.addChild(this.name);
    this.nameTag.addChild(this.nameBackground);
  }


  // SCALE TO THE CURRENT DEVICE
  resizeCanvas = () => {
    this.stage.canvas.width = Math.round(config.deviceWidth / config.scale);
    this.stage.canvas.height = Math.round(config.deviceHeight / config.scale);
  }


  updateCycle = () => {
    window.requestAnimationFrame(this.updateCycle);
    this.stage.removeAllChildren();

    const target = {
      x: this.stage.mouseX + (this.state.pos.x - (this.stage.canvas.width / 2)),
      y: this.stage.mouseY + (this.state.pos.y - (this.stage.canvas.height / 2)),
    };

    this.props.socket.emit('requestUpdate', target, data => {
      this.setState({ pos: data.player.pos });

      this.drawBackground();
      this.drawBoundary();
      this.drawWarning(data.player.outOfBounds ? data.player.outOfBounds.time : 0);
      this.drawPlayer(data.player);

      this.stage.update();
    });
  }


  // DRAW CURRENT PLAYER, SPEAR, AND NAME
  drawPlayer = player => {
    const { stage, playerBitmap, spearBitmap, nameTag, name, nameBackground } = this;

    // center the player
    playerBitmap.regX = playerBitmap.getBounds().width / 2;
    playerBitmap.regY = playerBitmap.getBounds().height / 2;
    playerBitmap.x = stage.canvas.width / 2;
    playerBitmap.y = stage.canvas.height / 2;

    // position the spear
    spearBitmap.regX = spearBitmap.getBounds().width / 2;
    spearBitmap.regY = spearBitmap.getBounds().height / 2;
    spearBitmap.x = playerBitmap.x + player.distanceToSpear.x;
    spearBitmap.y = playerBitmap.y + player.distanceToSpear.y;

    // rotate the player and spear towards their targets
    playerBitmap.rotation = player.direction - 90;
    spearBitmap.rotation = player.spear.direction - 90;

    // draw the player's name
    if (player.name) {
      name.text = player.name;
      name.y = nameTag.getBounds().height / 2;
      nameBackground.graphics.clear();
      nameBackground.graphics.beginFill('rgba(0, 0, 0, 0.1)')
        .drawRect(-10, -5, nameTag.getBounds().width + 20, nameTag.getBounds().height + 10);
      // position the name tag
      nameTag.regX = nameTag.getBounds().width / 2;
      nameTag.x = playerBitmap.x;
      nameTag.y = playerBitmap.y + 75;
    }

    stage.addChild(playerBitmap, spearBitmap, nameTag);
  }


  // DRAW BACKGROUND CELLS AROUND THE PLAYER"S POSITION
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
