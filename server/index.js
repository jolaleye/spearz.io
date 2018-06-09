const path = require('path');
const express = require('express');
const WebSocket = require('uws');

const config = require('./config');
const { ID } = require('./services/util');
const { encode, decode } = require('./services/parser');
const Room = require('./Room');
const Player = require('./Player');

const app = express();
const server = app.listen(config.port);
const ws = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, '../build')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../build', 'index.html')));

const rooms = {};

ws.on('connection', socket => {
  // assign the socket an ID
  socket.id = ID(2);
  socket.send(encode('id', { id: socket.id }));

  // remove empty rooms
  Object.values(rooms).forEach(room => {
    if (room.connections === 0) delete rooms[room.id];
  });

  // find a room with space
  let room = Object.values(rooms).find(candidate => candidate.connections < config.maxPlayers);
  // if they're all full make a new one
  if (!room) room = new Room();
  rooms[room.id] = room;
  // connect the player to the room
  socket.room = room;
  socket.room.connections += 1;
  socket.send(encode('roomId', { id: socket.room.id }));

  // player requests to join a specific room
  const joinRoom = id => {
    if (!rooms[id]) socket.send(encode('invalidRoom', { reason: 'Invalid room code' }));
    else if (rooms[id].connections >= config.maxPlayers) {
      socket.send(encode('invalidRoom', { reason: 'Room is full' }));
    } else {
      // join requested room
      socket.room = rooms[id];
      socket.room.connections += 1;
      socket.send(encode('roomId', { id: socket.room.id }));
    }
  };

  // player joins the game
  const joinGame = name => {
    // create a new player
    const newPlayer = new Player(socket.id, name, socket);
    socket.player = newPlayer;
    // add them to their room
    socket.room.players.push(newPlayer);
    // give them the good to go
    socket.send(encode('ready'));
    socket.room.updateLeaderboard(socket.player);
  };

  // player wants to throw their spear
  const throwSpear = target => {
    if (!(socket.player && socket.room)) return;
    socket.player.throw(target);
  };

  // client death procedures done, player is ready to be removed
  const removePlayer = () => {
    if (!(socket.player && socket.room)) return;
    socket.room.removePlayer(socket.id);
    socket.send(encode('dead', { ...socket.player.deathMsg }));
  };

  // update requested by the client
  const update = target => {
    if (!(socket.player && socket.room)) return;

    if (!socket.player.dead) socket.player.update(target);
    socket.room.update(socket.player);

    sendData();
  };

  // send data to the client
  const sendData = () => {
    socket.send(encode('update', {
      players: socket.room.fetchPlayers(socket.player, true).map(player => player.getData()),
    }));
  };

  socket.on('message', data => {
    const packet = decode(data);
    switch (packet._type) {
      case 'joinRoom': return joinRoom(packet.id);
      case 'joinGame': return joinGame(packet.name);
      case 'requestUpdate': return update(packet.target);
      case 'throw': return throwSpear(packet.target);
      case 'removePlayer': return removePlayer();
      default: return null;
    }
  });

  // player disconnects
  socket.onclose = () => {
    if (socket.player) socket.room.removePlayer(socket.player.id);
    if (socket.room) socket.room.connections -= 1;
  };
});

/* eslint no-param-reassign: off */
/* eslint no-use-before-define: off */
