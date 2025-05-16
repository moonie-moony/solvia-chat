const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

// Data structures to track users, friends, groups
const users = new Map(); // socket.id -> { username, friends: Set, currentRoom }
const groups = new Map(); // roomName -> Set of usernames

// Default global chat room
const GLOBAL_ROOM = "lobby";

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  // User joins with username
  socket.on("join", (username) => {
    users.set(socket.id, { username, friends: new Set(), currentRoom: GLOBAL_ROOM });
    socket.join(GLOBAL_ROOM);
    console.log(`${username} joined and entered ${GLOBAL_ROOM}`);

    // Send current room info to user
    socket.emit("joinedRoom", GLOBAL_ROOM);

    // Notify others in the room
    socket.to(GLOBAL_ROOM).emit("chat message", { username: "System", message: `${username} joined the room.` });
  });

  // Handle chat message
  socket.on("chat message", (data) => {
    // data = { message }
    const user = users.get(socket.id);
    if (!user) return;
    const room = user.currentRoom;
    io.to(room).emit("chat message", { username: user.username, message: data.message });
  });

  // Handle switching rooms/groups
  socket.on("joinRoom", (roomName) => {
    const user = users.get(socket.id);
    if (!user) return;

    const oldRoom = user.currentRoom;
    socket.leave(oldRoom);
    socket.join(roomName);

    user.currentRoom = roomName;

    if (!groups.has(roomName)) {
      groups.set(roomName, new Set());
    }
    groups.get(roomName).add(user.username);

    socket.emit("joinedRoom", roomName);
    socket.to(oldRoom).emit("chat message", { username: "System", message: `${user.username} left the room.` });
    socket.to(roomName).emit("chat message", { username: "System", message: `${user.username} joined the room.` });
  });

  // Handle adding friend
  socket.on("addFriend", (friendName) => {
    const user = users.get(socket.id);
    if (!user) return;

    user.friends.add(friendName);
    socket.emit("friendAdded", friendName);
  });

  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (user) {
      console.log(`${user.username} disconnected`);
      const room = user.currentRoom;
      socket.to(room).emit("chat message", { username: "System", message: `${user.username} left the room.` });
      users.delete(socket.id);

      // Remove user from any groups they belonged to
      for (const [roomName, members] of groups.entries()) {
        members.delete(user.username);
        if (members.size === 0) {
          groups.delete(roomName);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
