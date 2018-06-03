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

// all of the game rooms
const rooms = {};
// starter room
let newRoom = new Room();
rooms[newRoom.id] = newRoom;

io.on('connection', socket => {
  console.log(`Connection made: ${socket.id}`);

  // INITIAL ROOM CONNECTION
  let roomList = Object.values(rooms);
  let newestRoom = roomList[roomList.length - 1];
  // check if the newest room is full
  if (newestRoom.players.length >= config.maxPlayers) {
    newRoom = new Room();
    rooms[newRoom.id] = newRoom;

    roomList = Object.values(rooms);
    newestRoom = roomList[roomList.length - 1];
  }
  // connect the player to the newest room
  socket.join(newestRoom.id, () => socket.emit('roomId', Object.values(socket.rooms)[1]));
  // assign the room to the socket
  socket.room = newestRoom; // eslint-disable-line


  // PLAYER REQUESTS TO JOIN A ROOM
  socket.on('joinRoom', id => {
    if (!rooms[id]) socket.emit('invalidRoom');
    else {
      // leave current room
      socket.leave(Object.values(socket.rooms)[1]);
      // join requested room
      socket.join(id, () => socket.emit('roomId', Object.values(socket.rooms)[1]));
      // assign the room to the socket
      socket.room = rooms[id]; // eslint-disable-line
    }
  });


  // PLAYER JOINS THE GAME
  socket.on('joinGame', name => {
    console.log(`${name} wants to join room ${socket.room.id}`);
    // create a new player
    const newPlayer = new Player(socket.id, name);
    // add them to their room
    socket.room.players.push(newPlayer);
    // assign this player to the socket
    socket.player = newPlayer; // eslint-disable-line
    // give them the good to go
    socket.emit('ready');
  });


  // PLAYER REQUESTS AN UPDATE - INITIALIZE SERVER LOGIC AND RESPOND WITH UPDATED DATA
  socket.on('requestUpdate', (target, callback) => {
    if (!(socket.player && socket.room)) return;
    // check if the player is dead
    if (!socket.player.checkStatus()) {
      socket.room.removePlayer(socket.player.id);
      socket.emit('dead');
    }

    socket.player.update(target, socket.room);
    socket.room.update(socket.player);

    // respond with data needed by the canvas
    callback({
      player: socket.player,
      players: socket.room.fetchPlayers(socket.player),
    });

    // emit other data
    socket.emit('status', { health: socket.player.health });
    socket.emit('leaderboard', socket.room.createLeaderboard(socket.player));
    // if there is a message to display send it
    if (socket.player.message) socket.emit('message', socket.player.message);
    else socket.emit('clearMessage');
  });


  // PLAYER WANTS TO THROW THEIR SPEAR
  socket.on('throw', target => {
    if (!(socket.player && socket.room)) return;
    socket.player.throw(target);
  });


  // PLAYER DISCONNECTS
  socket.on('disconnect', () => {
    if (!(socket.player && socket.room)) return;
    socket.room.removePlayer(socket.player.id);
  });
});
