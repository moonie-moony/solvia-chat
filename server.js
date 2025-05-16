const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

const users = new Map();
const friendships = new Map();

app.use(express.static("public"));

io.on("connection", (socket) => {
  let username = null;

  socket.on("login", (name) => {
    username = name;
    users.set(username, socket);
    if (!friendships.has(username)) friendships.set(username, []);
    for (let [otherName, otherSocket] of users.entries()) {
      if (otherName !== username) {
        otherSocket.emit("friendRequest", username);
      }
    }
  });

  socket.on("publicMessage", (msg) => {
    io.emit("publicMessage", { sender: username, message: msg });
  });

  socket.on("privateMessage", ({ to, message }) => {
    const recipient = users.get(to);
    if (recipient) {
      recipient.emit("privateMessage", { from: username, message });
    }
  });

  socket.on("acceptFriend", (from) => {
    const fList = friendships.get(username);
    if (!fList.includes(from)) {
      fList.push(from);
    }

    const fromList = friendships.get(from) || [];
    if (!fromList.includes(username)) {
      fromList.push(username);
    }
    friendships.set(from, fromList);

    const otherSocket = users.get(from);
    if (otherSocket) {
      otherSocket.emit("friendListUpdate", fromList);
    }

    socket.emit("friendListUpdate", fList);
  });

  socket.on("disconnect", () => {
    if (username) {
      users.delete(username);
    }
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log("Server is running...");
});
