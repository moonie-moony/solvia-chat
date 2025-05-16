const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const users = {};
const friends = {};

io.on("connection", (socket) => {
  let currentUser = null;

  socket.on("join", (username) => {
    currentUser = username;
    users[currentUser] = socket.id;

    if (!friends[currentUser]) friends[currentUser] = [];

    // Send current friends status to user
    const friendsStatus = friends[currentUser].map((friendName) => ({
      name: friendName,
      online: users[friendName] !== undefined,
    }));

    socket.emit("friendsStatus", friendsStatus);
    socket.join("lobby");
    socket.emit("joinedRoom", "lobby");

    // Notify friends that user is online
    friends[currentUser].forEach((friendName) => {
      const friendSocketId = users[friendName];
      if (friendSocketId) {
        io.to(friendSocketId).emit("friendStatusUpdate", {
          name: currentUser,
          online: true,
        });
      }
    });
  });

  socket.on("addFriend", (friendName) => {
    if (!friends[currentUser].includes(friendName)) {
      friends[currentUser].push(friendName);
      socket.emit("friendAdded", { name: friendName, online: users[friendName] !== undefined });
    }
  });

  socket.on("chatMessage", (msg) => {
    io.to("lobby").emit("chatMessage", { user: currentUser, message: msg });
  });

  socket.on("disconnect", () => {
    if (currentUser) {
      delete users[currentUser];

      // Notify friends that user is offline
      if (friends[currentUser]) {
        friends[currentUser].forEach((friendName) => {
          const friendSocketId = users[friendName];
          if (friendSocketId) {
            io.to(friendSocketId).emit("friendStatusUpdate", {
              name: currentUser,
              online: false,
            });
          }
        });
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
