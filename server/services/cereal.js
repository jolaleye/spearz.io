exports.pack = data => {
  const packet = JSON.stringify(data);
  return packet;
};

exports.unpack = packet => {
  const data = JSON.parse(packet);
  return data;
};
