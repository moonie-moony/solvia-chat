const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// This will store users and their friend rooms (simplified for demo)
const users = new Map();

io.on("connection", (socket) => {
  console.log("User connected: " + socket.id);

  // Save username & friends from client
  socket.on("register", ({ username, friends }) => {
    users.set(socket.id, { username, friends });
    console.log(`User registered: ${username}, friends: ${friends}`);
  });

  // Join private room with friendID
  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`${socket.id} joined room ${room}`);
  });

  // Handle private messages only to room members
  socket.on("privateMessage", ({ room, message, from }) => {
    io.to(room).emit("privateMessage", { message, from });
  });

  socket.on("disconnect", () => {
    users.delete(socket.id);
    console.log("User disconnected: " + socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Solvia chat server running on port ${PORT}`);
});
