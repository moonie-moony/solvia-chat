const socket = io();

const loginSection = document.getElementById("login-section");
const chatSection = document.getElementById("chat-section");

const usernameInput = document.getElementById("username-input");
const loginBtn = document.getElementById("login-btn");

const friendsList = document.getElementById("friends-list");
const addFriendInput = document.getElementById("add-friend-input");
const addFriendBtn = document.getElementById("add-friend-btn");

const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");

let currentUser = null;

// Helper to render friend in the friends list
function renderFriend(friend) {
  const div = document.createElement("div");
  div.textContent = friend.name;
  div.style.color = friend.online ? "#90ee90" : "#ff6961"; // green or red
  div.id = `friend-${friend.name}`;
  return div;
}

// Login button handler
loginBtn.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  if (!username) return alert("Please enter a username");

  currentUser = username;
  socket.emit("join", username);

  loginSection.style.display = "none";
  chatSection.style.display = "block";
});

// Add friend button handler
addFriendBtn.addEventListener("click", () => {
  const friendName = addFriendInput.value.trim();
  if (!friendName) return alert("Please enter a friend's name");
  if (friendName === currentUser) return alert("You can't add yourself");

  socket.emit("addFriend", friendName);
  addFriendInput.value = "";
});

// Receive the full friend status list on join
socket.on("friendsStatus", (friends) => {
  friendsList.innerHTML = "<strong>Friends:</strong><br>";
  friends.forEach(friend => {
    friendsList.appendChild(renderFriend(friend));
  });
});

// New friend added
socket.on("friendAdded", (friend) => {
  friendsList.appendChild(renderFriend(friend));
});

// Friend status update (online/offline)
socket.on("friendStatusUpdate", ({ name, online }) => {
  const friendDiv = document.getElementById(`friend-${name}`);
  if (friendDiv) {
    friendDiv.style.color = online ? "#90ee90" : "#ff6961";
  }
});

// Send a chat message to the lobby
sendBtn.addEventListener("click", () => {
  const msg = messageInput.value.trim();
  if (!msg) return;

  socket.emit("chatMessage", msg);
  messageInput.value = "";
});

// Receive messages (including own)
socket.on("chatMessage", ({ user, message }) => {
  const msgDiv = document.createElement("div");
  msgDiv.innerHTML = `<strong>${user}</strong>: ${message}`;
  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// Optionally show joined room
socket.on("joinedRoom", (room) => {
  const info = document.createElement("div");
  info.style.fontStyle = "italic";
  info.textContent = `You joined ${room}`;
  messagesContainer.appendChild(info);
});
