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
    const newPlayer = new Player(socket.id, name, socket.room.id);
    // add them to their room
    socket.room.players.push(newPlayer);
    // assign this player to the socket
    socket.player = newPlayer; // eslint-disable-line
    // give them the good to go
    socket.emit('ready');
  });


  // PLAYER REQUESTS AN UPDATE - INITIALIZE SERVER LOGIC AND RESPOND WITH UPDATED DATA
  socket.on('requestUpdate', (target, callback) => {
    if (!socket.player.checkStatus()) {
      socket.room.removePlayer(socket.player.id);
      socket.emit('dead');
    }

    socket.player.update(target, socket.room);

    // respond with data needed by the canvas
    callback({
      player: socket.player,
      players: socket.room.fetchPlayers(socket.player),
    });

    // emit other data
    socket.emit('status', { health: socket.player.health });
    socket.emit('leaderboard', socket.room.createLeaderboard(socket.player));
  });


  // PLAYER WANTS TO THROW THEIR SPEAR
  socket.on('throw', target => socket.player.throw(target));


  // PLAYER DISCONNECTS
  socket.on('disconnect', () => {
    // eslint-disable-next-line
    socket.room.players = socket.room.players.filter(player => player.id !== socket.id);
  });
});
