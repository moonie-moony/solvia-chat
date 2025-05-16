const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// Map to track online users: username -> socket.id
const onlineUsers = new Map();

// Map to store each user’s friends: username -> Set of friends
const friendsMap = new Map();

io.on("connection", (socket) => {
  let currentUser = null;

  // User joins with a username
  socket.on("join", (username) => {
    currentUser = username;
    onlineUsers.set(username, socket.id);

    // Initialize friends set if new user
    if (!friendsMap.has(username)) friendsMap.set(username, new Set());

    // Send friend statuses to the user
    const friends = Array.from(friendsMap.get(username));
    const friendStatuses = friends.map(friendName => ({
      name: friendName,
      online: onlineUsers.has(friendName)
    }));
    socket.emit("friendsStatus", friendStatuses);

    // Notify this user’s friends that they are now online
    friends.forEach(friendName => {
      const friendSocketId = onlineUsers.get(friendName);
      if (friendSocketId) {
        io.to(friendSocketId).emit("friendStatusUpdate", { name: username, online: true });
      }
    });

    // Optionally join a public "lobby" room for group chat
    socket.join("lobby");
    socket.emit("joinedRoom", "lobby");
  });

  // Handle friend request / add friend
  socket.on("addFriend", (friendName) => {
    if (!currentUser) return;

    // Add friend both ways (simple symmetric friendship)
    friendsMap.get(currentUser).add(friendName);
    if (!friendsMap.has(friendName)) friendsMap.set(friendName, new Set());
    friendsMap.get(friendName).add(currentUser);

    // Inform current user that friend was added
    socket.emit("friendAdded", { name: friendName, online: onlineUsers.has(friendName) });

    // Notify friend (if online) they got a new friend
    const friendSocketId = onlineUsers.get(friendName);
    if (friendSocketId) {
      io.to(friendSocketId).emit("friendAdded", { name: currentUser, online: true });
    }
  });

  // Handle user disconnecting
  socket.on("disconnect", () => {
    if (!currentUser) return;

    // Remove user from online users
    onlineUsers.delete(currentUser);

    // Notify friends user went offline
    const friends = Array.from(friendsMap.get(currentUser) || []);
    friends.forEach(friendName => {
      const friendSocketId = onlineUsers.get(friendName);
      if (friendSocketId) {
        io.to(friendSocketId).emit("friendStatusUpdate", { name: currentUser, online: false });
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
