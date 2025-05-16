const socket = io();

// Simulated user & friends — replace with real login system later
const myUsername = prompt("Enter your username") || "User" + Math.floor(Math.random() * 1000);
const myFriends = ["friend1", "friend2"]; // usernames of your friends
let currentRoom = null;

const friendsListEl = document.getElementById("friendsList");
const chatArea = document.getElementById("chatArea");
const inputEl = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

// Register user & friends on server
socket.emit("register", { username: myUsername, friends: myFriends });

// Create friend list UI
function updateFriendsList() {
  friendsListEl.innerHTML = "";
  myFriends.forEach((friend) => {
    const btn = document.createElement("button");
    btn.textContent = friend;
    btn.classList.add("friendBtn");
    btn.onclick = () => joinRoom(friend);
    friendsListEl.appendChild(btn);
  });
}

// Join chat room with a friend
function joinRoom(friend) {
  if (currentRoom) socket.emit("leaveRoom", currentRoom);
  currentRoom = [myUsername, friend].sort().join("_"); // unique room name
  chatArea.innerHTML = "";
  socket.emit("joinRoom", currentRoom);
}

// Receive private messages and show animated bubble chat
socket.on("privateMessage", ({ message, from }) => {
  const bubble = document.createElement("div");
  bubble.classList.add("chatBubble");
  if (from === myUsername) bubble.classList.add("myBubble");
  else bubble.classList.add("friendBubble");
  bubble.textContent = `${from}: ${message}`;
  chatArea.appendChild(bubble);

  // Animate bubble fade in
  bubble.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, fill: "forwards" });

  // Auto-scroll to bottom
  chatArea.scrollTop = chatArea.scrollHeight;
});

// Send message handler
sendBtn.onclick = () => {
  const msg = inputEl.value.trim();
  if (!msg || !currentRoom) return;
  socket.emit("privateMessage", { room: currentRoom, message: msg, from: myUsername });
  inputEl.value = "";
};

// Init
updateFriendsList();
