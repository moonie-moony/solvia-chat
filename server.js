const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

const users = new Map(); // username => socket.id
const friendships = new Map(); // username => Set of friend names

app.use(express.static("public"));

io.on("connection", (socket) => {
  let currentUser = null;

  socket.on("login", (username) => {
    currentUser = username;
    users.set(username, socket.id);
    if (!friendships.has(username)) friendships.set(username, new Set());
    // Broadcast updated user list if needed.
    io.emit("userList", Array.from(users.keys()));
  });

  socket.on("publicMessage", (msg) => {
    if (!currentUser) return;
    const timestamp = new Date().toISOString();
    io.emit("publicMessage", { from: currentUser, message: msg, timestamp });
  });

  socket.on("privateMessage", ({ to, message }) => {
    if (!currentUser) return;
    const timestamp = new Date().toISOString();
    const recipientSocketId = users.get(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("privateMessage", { from: currentUser, message, timestamp });
      // Echo back to sender.
      socket.emit("privateMessage", { from: currentUser, message, timestamp });
    }
  });

  socket.on("sendFriendRequest", (to) => {
    if (!currentUser) return;
    const recipientSocketId = users.get(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("friendRequest", currentUser);
    }
  });

  socket.on("acceptFriendRequest", (from) => {
    if (!currentUser) return;
    // Add the friendship symmetrically.
    if (!friendships.has(currentUser)) friendships.set(currentUser, new Set());
    if (!friendships.has(from)) friendships.set(from, new Set());
    friendships.get(currentUser).add(from);
    friendships.get(from).add(currentUser);
    // Notify both users of updated friend list.
    socket.emit("friendListUpdate", Array.from(friendships.get(currentUser)));
    const fromSocketId = users.get(from);
    if (fromSocketId) {
      io.to(fromSocketId).emit("friendListUpdate", Array.from(friendships.get(from)));
    }
  });

  socket.on("disconnect", () => {
    if (currentUser) {
      users.delete(currentUser);
      io.emit("userList", Array.from(users.keys()));
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Solvia chat server running on port ${PORT}`));
