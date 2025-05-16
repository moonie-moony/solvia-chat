const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let users = {}; // socket.id -> username
let friends = {}; // username -> Set of friends
let friendRequests = {}; // username -> Set of pending requests
let publicMessages = []; // store last 100 public messages
let privateMessages = {}; // {user1_user2: [{from, to, text, time}]}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User sets username
  socket.on('set username', (username) => {
    users[socket.id] = username;
    if (!friends[username]) friends[username] = new Set();
    if (!friendRequests[username]) friendRequests[username] = new Set();

    // Send initial data
    socket.emit('init', {
      username,
      friends: Array.from(friends[username]),
      friendRequests: Array.from(friendRequests[username]),
      publicMessages,
    });
  });

  // Public chat message
  socket.on('public message', (msg) => {
    const username = users[socket.id];
    if (!username) return;

    const message = {
      from: username,
      text: msg,
      time: new Date().toISOString(),
    };
    publicMessages.push(message);
    if (publicMessages.length > 100) publicMessages.shift();

    io.emit('public message', message);
  });

  // Send friend request
  socket.on('send friend request', (toUser) => {
    const fromUser = users[socket.id];
    if (!fromUser || !toUser || fromUser === toUser) return;

    if (!friendRequests[toUser]) friendRequests[toUser] = new Set();
    friendRequests[toUser].add(fromUser);

    // Notify the user if connected
    for (const [id, name] of Object.entries(users)) {
      if (name === toUser) {
        io.to(id).emit('friend request received', fromUser);
      }
    }
  });

  // Accept friend request
  socket.on('accept friend request', (fromUser) => {
    const toUser = users[socket.id];
    if (!toUser || !fromUser) return;

    if (friendRequests[toUser] && friendRequests[toUser].has(fromUser)) {
      friendRequests[toUser].delete(fromUser);
      friends[toUser].add(fromUser);
      if (!friends[fromUser]) friends[fromUser] = new Set();
      friends[fromUser].add(toUser);

      // Update both users friend lists
      for (const [id, name] of Object.entries(users)) {
        if (name === toUser || name === fromUser) {
          io.to(id).emit('friend list update', Array.from(friends[name]));
          io.to(id).emit('friend requests update', Array.from(friendRequests[name]));
        }
      }
    }
  });

  // Private message
  socket.on('private message', ({ toUser, text }) => {
    const fromUser = users[socket.id];
    if (!fromUser || !toUser || !text) return;

    const chatKey = [fromUser, toUser].sort().join('_');
    if (!privateMessages[chatKey]) privateMessages[chatKey] = [];

    const message = {
      from: fromUser,
      to: toUser,
      text,
      time: new Date().toISOString(),
    };

    privateMessages[chatKey].push(message);
    if (privateMessages[chatKey].length > 100) privateMessages[chatKey].shift();

    // Send message to both users if connected
    for (const [id, name] of Object.entries(users)) {
      if (name === fromUser || name === toUser) {
        io.to(id).emit('private message', { chatKey, message });
      }
    }
  });

  // Request private chat history
  socket.on('get private messages', (otherUser) => {
    const fromUser = users[socket.id];
    if (!fromUser || !otherUser) return;

    const chatKey = [fromUser, otherUser].sort().join('_');
    socket.emit('private messages history', {
      chatKey,
      messages: privateMessages[chatKey] || [],
    });
  });

  // Disconnect cleanup
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete users[socket.id];
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
