import assetManager from '../../../services/assetManager';

const { Container, Shape, Bitmap } = window.createjs;
const { assets } = assetManager;

// manages the background, boundary, and boundary warning
class ArenaManager {
  constructor() {
    this.backgroundCells = new Container();
    this.backgroundCell = new Bitmap(assets.getResult('background'));
    this.boundary = new Shape();
    this.boundaryWarning = new Shape();
  }

  update(canvas, pos, timeOutOfBounds) {
    this.boundary.graphics.clear();
    this.boundaryWarning.graphics.clear();

    this.drawBackground(canvas, pos);
    this.drawBoundary(canvas, pos);
    if (timeOutOfBounds > 0) this.drawBoundaryWarning(canvas, timeOutOfBounds);
  }

  // draw background cells according to the player's position
  drawBackground(canvas, pos) {
    const { backgroundCells, backgroundCell } = this;

    const xNumOfCells = Math.ceil(canvas.width / backgroundCell.image.width) + 1;
    const yNumOfCells = Math.ceil(canvas.height / backgroundCell.image.height) + 1;

    const xOffset = pos.x % backgroundCell.image.width;
    const yOffset = pos.y % backgroundCell.image.height;

    backgroundCells.removeAllChildren();

    for (let x = -xNumOfCells; x < xNumOfCells; x += 1) {
      for (let y = -yNumOfCells; y < yNumOfCells; y += 1) {
        const cell = backgroundCell.clone();
        cell.x = -xOffset + (x * cell.getBounds().width);
        cell.y = -yOffset + (y * cell.getBounds().height);
        backgroundCells.addChild(cell);
      }
    }
  }

  // draw the boundary ring
  drawBoundary(canvas, pos) {
    const { boundary } = this;

    boundary.x = canvas.width / 2;
    boundary.y = canvas.height / 2;

    boundary.graphics.setStrokeStyle(10).beginStroke('rgba(255, 255, 255, 0.1)')
      .drawCircle(-pos.x, -pos.y, 5000);
  }

  // fade screen to black while out of bounds
  drawBoundaryWarning(canvas, timeOutOfBounds) {
    const { boundaryWarning } = this;

    const alpha = timeOutOfBounds / 8;
    boundaryWarning.graphics.beginFill(`rgba(0, 0, 0, ${alpha})`)
      .drawRect(0, 0, canvas.width, canvas.height);
  }
}

export default ArenaManager;
