const path = require('path');
const express = require('express');
const WebSocket = require('uws');

const config = require('./config');
const Lobby = require('./Lobby');
const { unpack } = require('./services/cereal');

const app = express();
const server = app.listen(config.port);
const ws = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, '../build')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

const lobby = new Lobby();

ws.on('connection', client => {
  lobby.initiate(client);

  client.on('message', packet => {
    const data = unpack(packet);
    switch (data._) {
      case 'joinRoom':
        if (!data.key) break;
        lobby.joinRoom(client, data.key);
        break;

      case 'joinGame':
        lobby.joinGame(client, data.nickname);
        break;

      case 'target':
        if (!data.target || !data.tick) break;
        lobby.rooms[client.room].addToQueue(client.id, data);
        break;

      default: break;
    }
  });

  client.on('close', () => {
    lobby.disconnect(client);
  });
});
