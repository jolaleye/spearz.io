const express = require('express');

const app = express();

const config = require('./config');
const Room = require('./Room');
const Player = require('./Player');

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(`${__dirname}/../build`));
  app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/../build/index.html`);
  });
}

const server = app.listen(3001, () => console.log('Server started on port 3001'));

const io = require('socket.io')(server);

io.origins('http://localhost:3000');

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


  // PLAYER REQUESTS TO JOIN A ROOM
  socket.on('joinRoom', id => {
    if (!rooms[id]) socket.emit('invalidRoom');
    else {
      // leave current room
      socket.leave(Object.values(socket.rooms)[1]);
      // join requested room
      socket.join(id, () => socket.emit('roomId', Object.values(socket.rooms)[1]));
    }
  });


  // PLAYER JOINS THE GAME
  socket.on('joinGame', name => {
    const roomId = Object.values(socket.rooms)[1];
    console.log(`${name} wants to join room ${roomId}`);
    // create a new player
    const newPlayer = new Player(socket.id, name, roomId);
    // add them to their room
    rooms[roomId].players.push(newPlayer);
    // assign this player to the socket
    socket.player = newPlayer; // eslint-disable-line
    // give them the good to go
    socket.emit('ready');
  });


  socket.on('requestPlayerData', callback => callback(socket.player));
});
