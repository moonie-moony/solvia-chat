const socket = io();

const myUsername = prompt("Enter your username") || "User" + Math.floor(Math.random() * 1000);
const myFriends = ["friend1", "friend2"]; // Example friends - replace with real data if you want
let currentRoom = null;

const friendsListEl = document.getElementById("friendsList");
const chatArea = document.getElementById("chatArea");
const inputEl = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

socket.emit("register", { username: myUsername, friends: myFriends });

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

function joinRoom(friend) {
  if (currentRoom) socket.emit("leaveRoom", currentRoom);
  currentRoom = [myUsername, friend].sort().join("_");
  chatArea.innerHTML = "";
  socket.emit("joinRoom", currentRoom);
}

socket.on("privateMessage", ({ message, from }) => {
  const bubble = document.createElement("div");
  bubble.classList.add("chatBubble");
  if (from === myUsername) bubble.classList.add("myBubble");
  else bubble.classList.add("friendBubble");
  bubble.textContent = `${from}: ${message}`;
  chatArea.appendChild(bubble);

  bubble.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, fill: "forwards" });

  chatArea.scrollTop = chatArea.scrollHeight;
});

sendBtn.onclick = () => {
  const msg = inputEl.value.trim();
  if (!msg || !currentRoom) return;
  socket.emit("privateMessage", { room: currentRoom, message: msg, from: myUsername });
  inputEl.value = "";
};

updateFriendsList();
