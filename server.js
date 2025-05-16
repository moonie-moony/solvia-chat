const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = 3000;

// Serve static files from current folder
app.use(express.static(__dirname));

// Data storage (in-memory)
let users = {};
let friendRequests = {};
let friends = {};

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  // When user joins with username
  socket.on('join', username => {
    socket.username = username;
    users[username] = socket.id;
    if (!friends[username]) friends[username] = [];
    if (!friendRequests[username]) friendRequests[username] = [];

    // Send current friends and requests to client
    socket.emit('friendsList', friends[username]);
    socket.emit('friendRequests', friendRequests[username]);
  });

  // Handle friend request
  socket.on('friendRequest', ({ from, to }) => {
    if (!friendRequests[to]) friendRequests[to] = [];
    if (!friendRequests[to].includes(from)) {
      friendRequests[to].push(from);
      const toSocketId = users[to];
      if (toSocketId) {
        io.to(toSocketId).emit('friendRequests', friendRequests[to]);
      }
    }
  });

  // Handle public chat message
  socket.on('publicMessage', msg => {
    io.emit('publicMessage', msg);
  });

  // Handle private chat message
  socket.on('privateMessage', msg => {
    const toSocketId = users[msg.to];
    if (toSocketId) {
      io.to(toSocketId).emit('privateMessage', msg);
    }
    // Also send to sender to show in their chat window
    socket.emit('privateMessage', msg);
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      console.log('User disconnected:', socket.username);
      delete users[socket.username];
    }
  });
});

http.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
