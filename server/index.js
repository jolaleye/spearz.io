const path = require('path');
const express = require('express');
const io = require('socket.io')();

const config = require('./config');
const Room = require('./Room');
const Player = require('./Player');

const app = express();
const server = app.listen(config.port);
io.attach(server);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'build')));
  app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'build', 'index.html')));
}

const rooms = {};

/* eslint no-param-reassign: "off" */
io.on('connection', socket => {
  console.log(`Connection made: ${socket.id}`);

  // remove empty rooms
  Object.values(rooms).forEach(roomToCheck => {
    if (roomToCheck.connections === 0) delete rooms[roomToCheck.id];
  });

  // initial room connection - try to find a room with space
  let room = Object.values(rooms).find(candidate => candidate.connections < config.maxPlayers);
  // if they're all full make a new one
  if (!room) room = new Room(io);
  rooms[room.id] = room;
  // connect the player to the room
  socket.join(room.id, () => socket.emit('roomId', room.id));
  socket.room = room;
  socket.room.connections += 1;

  // player requests to join a specific room
  socket.on('joinRoom', id => {
    if (!rooms[id]) socket.emit('invalidRoom', 'Invalid room code');
    else if (rooms[id].connections >= config.maxPlayers) {
      socket.emit('invalidRoom', 'Room is full');
    } else {
      // leave current room
      socket.leave(socket.room.id);
      // join requested room
      socket.join(id, () => socket.emit('roomId', id));
      socket.room = rooms[id];
      socket.room.connections += 1;
    }
  });

  // player joins the game
  socket.on('joinGame', name => {
    // create a new player
    const newPlayer = new Player(socket.id, name);
    // add them to their room
    socket.room.players.push(newPlayer);
    // give them the good to go
    socket.player = newPlayer;
    socket.emit('ready');
  });

  // player requests an update - respond with updated data
  socket.on('requestUpdate', (target, callback) => {
    if (!(socket.player && socket.room)) return;

    // check if the player is dead
    if (!socket.player.checkStatus()) {
      socket.room.removePlayer(socket.player.id);
      socket.emit('dead', socket.player.killedBy);
    }

    socket.player.update(target);
    socket.room.update(socket.player);

    // respond with data needed by the canvas
    callback({
      player: socket.player,
      players: socket.room.fetchPlayers(socket.player),
    });

    // emit other data
    socket.emit('status', { health: socket.player.health });
    socket.emit('leaderboard', socket.room.createLeaderboard(socket.player));
    // if there is a message to display, send it
    if (socket.player.message) socket.emit('message', socket.player.message);
    else socket.emit('clearMessage');
  });

  // player wants to throw their spear
  socket.on('throw', target => {
    if (!(socket.player && socket.room)) return;
    socket.player.throw(target);
  });

  // player disconnects
  socket.on('disconnect', () => {
    if (socket.player) socket.room.removePlayer(socket.player.id);
    if (socket.room) socket.room.connections -= 1;
  });
});
