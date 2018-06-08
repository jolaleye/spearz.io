exports.ID = pieces => {
  // generate an id piece
  const piece = () => Math.random().toString(36).substr(2, 9);
  // if "pieces" was passed, combine multiple id pieces
  if (pieces) {
    let id = '';
    for (let i = 0; i < pieces; i += 1) {
      if (i === pieces - 1) id += piece();
      else id += `${piece()}-`;
    }
    return id;
  }
  // default to 1 piece
  return piece();
};

exports.getDistance = (x1, x2, y1, y2) => ({
  x: x2 - x1,
  y: y2 - y1,
  total: Math.sqrt(((x2 - x1) ** 2) + ((y2 - y1) ** 2)),
});
