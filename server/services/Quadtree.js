const _ = require('lodash');

class Quadtree {
  constructor(bounds) {
    // defines the node's center at (bounds.x, bounds.y) with side length bounds.length
    this.bounds = bounds;

    this.capacity = 20;
    this.nodes = [];
    this.items = [];
  }

  split() {
    const { x, y, length } = this.bounds;
    const subLength = length / 2;

    // north west -> clockwise
    this.nodes.push(
      new Quadtree({ x: x - (subLength / 2), y: y - (subLength / 2), length: subLength }),
      new Quadtree({ x: x + (subLength / 2), y: y - (subLength / 2), length: subLength }),
      new Quadtree({ x: x - (subLength / 2), y: y + (subLength / 2), length: subLength }),
      new Quadtree({ x: x + (subLength / 2), y: y + (subLength / 2), length: subLength }),
    );

    // move children to new subnodes
    const { items } = this;
    this.items = [];
    items.forEach(item => this.insert(item));
  }

  // find the subnode that contains the item
  findContainer(item) {
    return this.nodes.findIndex(node => node.contains(item));
  }

  contains(item) {
    return (
      item.qt.x + (item.qt.width / 2) <= this.bounds.x + (this.bounds.length / 2) &&
      item.qt.x - (item.qt.width / 2) >= this.bounds.x - (this.bounds.length / 2) &&
      item.qt.y + (item.qt.height / 2) <= this.bounds.y + (this.bounds.length / 2) &&
      item.qt.y - (item.qt.height / 2) >= this.bounds.y - (this.bounds.length / 2)
    );
  }

  insert(item) {
    if (!this.contains(item)) return;

    // if this node has subnodes, try inserting the item into one of them
    if (!_.isEmpty(this.nodes)) {
      const index = this.findContainer(item);
      if (index !== -1) {
        this.nodes[index].insert(item);
        return;
      }
    }

    // if the node doesn't have subnodes or the item doesn't fit in one, insert it here
    this.items.push(item);

    // split if this node has exceeded capacity
    if (this.items.length >= this.capacity && _.isEmpty(this.nodes)) {
      this.split();
    }
  }

  // return collision candidates
  retrieve(item) {
    let candidates = this.items;

    // if this node has subnodes...
    if (!_.isEmpty(this.nodes)) {
      const index = this.findContainer(item);
      // if the item is within a subnode, retrieve from that node
      if (index !== -1) candidates = candidates.concat(this.nodes[index].retrieve(item));
      // otherwise retrieve from all subnodes
      else {
        this.nodes.forEach(node => {
          candidates = candidates.concat(node.retrieve(item));
        });
      }
    }

    return candidates;
  }

  // clear this node and all nodes below it
  clear() {
    this.items = [];
    this.nodes.forEach(node => node.clear());
    this.nodes = [];
  }
}

module.exports = Quadtree;
