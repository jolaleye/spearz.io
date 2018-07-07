export const pack = data => {
  const packet = JSON.stringify(data);
  return packet;
};

export const unpack = packet => {
  const data = JSON.parse(packet);
  return data;
};
