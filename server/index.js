const path = require('path');
const http = require('http');
const express = require('express');
const WebSocket = require('uws');

const Lobby = require('./Lobby');
const { unpack } = require('./services/cereal');

const app = express();
const server = http.createServer(app);
const ws = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, '../build')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

const lobby = new Lobby();

ws.on('connection', client => {
  lobby.initiate(client);

  client.on('message', packet => {
    if (packet === 'pong') {
      client.latency = (Date.now() - client.startTime) / 2;
      return;
    }

    const data = unpack(packet);
    switch (data._) {
      case 'joinRoom':
        lobby.joinRoom(client, data.key);
        break;

      case 'joinGame':
        if (!lobby.rooms[client.room]) break;
        lobby.rooms[client.room].joinGame(client, data.nickname);
        break;

      case 'target':
        if (!client.player || !lobby.rooms[client.room]) break;
        lobby.rooms[client.room].addToQueue('target', client.id, data);
        break;

      case 'throw':
        if (!client.player || !lobby.rooms[client.room]) break;
        lobby.rooms[client.room].addToQueue('throw', client.id);
        break;

      case 'clientView':
        client.viewDistance = data.distance;
        break;

      case 'remove':
        lobby.disconnect(client, true);
        break;

      default: break;
    }
  });

  client.on('close', () => {
    lobby.disconnect(client);
  });
});

server.listen(process.env.PORT || 3001);

/* eslint no-param-reassign: off */
