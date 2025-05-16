const socket = io();

let username = "";
let currentChat = "Everyone"; // "Everyone" means public chat
let friendList = []; 
let friendRequests = [];

const loginScreen = document.getElementById("loginScreen");
const usernameInput = document.getElementById("usernameInput");
const loginBtn = document.getElementById("loginBtn");

const chatApp = document.getElementById("chatApp");
const currentUserDisplay = document.getElementById("currentUser");
const everyoneBtn = document.getElementById("everyoneBtn");
const friendsListDiv = document.getElementById("friendsList");
const friendRequestsDiv = document.getElementById("friendRequests");

const chatHeader = document.getElementById("chatHeader");
const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// Enable login button only when input is not empty
usernameInput.addEventListener("input", () => {
  loginBtn.disabled = usernameInput.value.trim() === "";
});

loginBtn.addEventListener("click", () => {
  username = usernameInput.value.trim();
  if (!username) return;
  socket.emit("login", username);
  currentUserDisplay.textContent = `Logged in as: ${username}`;
  loginScreen.classList.add("hidden");
  chatApp.classList.remove("hidden");
  selectChat("Everyone");
});

everyoneBtn.addEventListener("click", () => {
  selectChat("Everyone");
});

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const msg = messageInput.value.trim();
  if (!msg) return;
  const timestamp = new Date().toISOString();
  if (currentChat === "Everyone") {
    socket.emit("publicMessage", msg);
  } else {
    socket.emit("privateMessage", { to: currentChat, message: msg });
    displayMessage("private", username, msg, timestamp, true); // echo your private message
  }
  messageInput.value = "";
}

function displayMessage(chatFor, sender, message, timestamp, isSelf) {
  // Only display message if current chat matches the chat for which it is intended.
  if ((chatFor === "Everyone" && currentChat !== "Everyone") ||
      (chatFor !== "Everyone" && currentChat !== chatFor)) {
    return;
  }
  const div = document.createElement("div");
  div.className = "message " + (isSelf ? "self" : "other");
  div.innerHTML = `<strong>${sender}</strong>: ${message} <span class="timestamp">${formatTimestamp(timestamp)}</span>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

socket.on("publicMessage", ({ from, message, timestamp }) => {
  displayMessage("Everyone", from, message, timestamp, from === username);
});

socket.on("privateMessage", ({ from, message, timestamp }) => {
  // If the active chat is with the sender, show the message.
  if (currentChat === from) {
    displayMessage("private", from, message, timestamp, false);
  } else {
    // Optionally, add a notification indicator for new private messages.
  }
});

// When a friend request is received, add it to the friendRequests array and update UI.
socket.on("friendRequest", (from) => {
  if (!friendRequests.includes(from)) {
    friendRequests.push(from);
    renderFriendRequests();
  }
});

// When friend list is updated by the server, update UI.
socket.on("friendListUpdate", (newList) => {
  friendList = newList;
  renderFriends();
});

function renderFriends() {
  friendsListDiv.innerHTML = "";
  friendList.forEach((friend) => {
    const btn = document.createElement("button");
    btn.className = "friend-btn";
    btn.textContent = friend;
    btn.onclick = () => selectChat(friend);
    friendsListDiv.appendChild(btn);
  });
}

function renderFriendRequests() {
  friendRequestsDiv.innerHTML = "";
  friendRequests.forEach((req) => {
    const btn = document.createElement("button");
    btn.className = "friend-btn";
    btn.textContent = `Accept ${req}`;
    btn.onclick = () => {
      socket.emit("acceptFriendRequest", req);
      friendRequests = friendRequests.filter(r => r !== req);
      renderFriendRequests();
    };
    friendRequestsDiv.appendChild(btn);
  });
}

function selectChat(chatName) {
  currentChat = chatName;
  chatHeader.textContent = (chatName === "Everyone") ? "Public Chat" : `Chat with ${chatName}`;
  chatMessages.innerHTML = "";
}

function formatTimestamp(iso) {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
