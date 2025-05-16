const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

const users = new Set();

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join", (username) => {
    users.add(username);
    console.log(`${username} joined`);
  });

  socket.on("chat message", (data) => {
    // data = { username, message }
    io.emit("chat message", data);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    // Optional: remove username from users Set here if you track usernames by socket
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
