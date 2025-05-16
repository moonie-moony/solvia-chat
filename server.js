const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// Store users: socket.id => { username, friends: Set }
const users = new Map();

io.on("connection", (socket) => {
  console.log("User connected: " + socket.id);

  socket.on("register", (username) => {
    users.set(socket.id, { username, friends: new Set() });
    // Broadcast user list update for friend adding
    broadcastUserList();
  });

  socket.on("getUsers", () => {
    // Send back the list of all connected users
    const allUsers = Array.from(users.values()).map(u => u.username);
    socket.emit("userList", allUsers);
  });

  socket.on("addFriend", (friendName) => {
    const user = users.get(socket.id);
    if (!user) return;
    if (user.username === friendName) return; // cannot add yourself

    // Find friend's socket id
    const friendEntry = Array.from(users.entries()).find(([_, u]) => u.username === friendName);
    if (!friendEntry) return;

    user.friends.add(friendName);

    // Notify this socket about new friend
    socket.emit("friendAdded", friendName);
  });

  socket.on("sendPublicMessage", (message) => {
    const user = users.get(socket.id);
    if (!user) return;

    const msgObj = {
      from: user.username,
      message,
      timestamp: new Date().toISOString(),
    };

    io.emit("publicMessage", msgObj);
  });

  socket.on("sendPrivateMessage", ({ to, message }) => {
    const user = users.get(socket.id);
    if (!user) return;

    // Find friend socket
    const friendEntry = Array.from(users.entries()).find(([_, u]) => u.username === to);
    if (!friendEntry) return;

    const [friendSocketId] = friendEntry;

    const msgObj = {
      from: user.username,
      to,
      message,
      timestamp: new Date().toISOString(),
    };

    // Send message to friend and sender
    io.to(friendSocketId).emit("privateMessage", msgObj);
    socket.emit("privateMessage", msgObj);
  });

  socket.on("disconnect", () => {
    users.delete(socket.id);
    broadcastUserList();
    console.log("User disconnected: " + socket.id);
  });

  function broadcastUserList() {
    const allUsers = Array.from(users.values()).map(u => u.username);
    io.emit("userList", allUsers);
  }
});

server.listen(PORT, () => {
  console.log(`Solvia chat server running on port ${PORT}`);
});
