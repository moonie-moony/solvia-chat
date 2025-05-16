const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// In-memory data
const users = {};          // socket.id => username
const usernames = new Set(); // all usernames connected
const friends = {};        // username => [friends]
const friendRequests = {}; // username => [requests]

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (username) => {
    if (!username || usernames.has(username)) {
      socket.emit('join_error', 'Username taken or invalid');
      return;
    }
    users[socket.id] = username;
    usernames.add(username);

    // Init friend data if not exists
    if (!friends[username]) friends[username] = [];
    if (!friendRequests[username]) friendRequests[username] = [];

    socket.emit('join_success', username);
    io.emit('friend_list', friends[username]);
    socket.join('public');

    console.log(`${username} joined`);
  });

  // Public message
  socket.on('public_message', (msg) => {
    const sender = users[socket.id];
    if (!sender) return;
    io.to('public').emit('public_message', {
      sender,
      text: msg,
      timestamp: Date.now()
    });
  });

  // Send friend request
  socket.on('friend_request_send', (target) => {
    const sender = users[socket.id];
    if (!sender || sender === target) return;
    if (!usernames.has(target)) return;
    if (!friendRequests[target]) friendRequests[target] = [];
    if (!friendRequests[target].includes(sender) && !friends[target].includes(sender)) {
      friendRequests[target].push(sender);
      io.emit('friend_request_received', target);
    }
  });

  // Accept friend request
  socket.on('friend_request_accept', (fromUser) => {
    const username = users[socket.id];
    if (!username) return;

    friendRequests[username] = friendRequests[username].filter(u => u !== fromUser);
    if (!friends[username].includes(fromUser)) friends[username].push(fromUser);
    if (!friends[fromUser].includes(username)) friends[fromUser].push(username);

    // Notify both users
    io.emit('friend_request_accepted', { user1: username, user2: fromUser });
  });

  // Decline friend request
  socket.on('friend_request_decline', (fromUser) => {
    const username = users[socket.id];
    if (!username) return;
    friendRequests[username] = friendRequests[username].filter(u => u !== fromUser);
    io.emit('friend_request_declined', username);
  });

  // Private message
  socket.on('private_message', ({ to, text }) => {
    const sender = users[socket.id];
    if (!sender || !usernames.has(to)) return;

    // Find socket id of recipient
    const recipientSocketId = Object.keys(users).find(id => users[id] === to);
    if (!recipientSocketId) return;

    const msgData = {
      sender,
      receiver: to,
      text,
      timestamp: Date.now()
    };

    socket.emit('private_message', msgData); // send back to sender
    io.to(recipientSocketId).emit('private_message', msgData); // send to recipient
  });

  // Disconnect
  socket.on('disconnect', () => {
    const username = users[socket.id];
    if (username) {
      usernames.delete(username);
      delete users[socket.id];
      console.log(`${username} disconnected`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
