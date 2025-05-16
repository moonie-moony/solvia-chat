const socket = io();

const loginContainer = document.getElementById("loginContainer");
const usernameInput = document.getElementById("usernameInput");
const loginBtn = document.getElementById("loginBtn");
const appContainer = document.getElementById("appContainer");

const currentUserEl = document.getElementById("currentUser");
const publicChat = document.getElementById("publicChat");
const publicInput = document.getElementById("publicInput");
const sendPublicBtn = document.getElementById("sendPublicBtn");

const friendsList = document.getElementById("friendsList");
const privateChatSection = document.getElementById("privateChatSection");
const privateChatWithEl = document.getElementById("privateChatWith");
const privateChat = document.getElementById("privateChat");
const privateInput = document.getElementById("privateInput");
const sendPrivateBtn = document.getElementById("sendPrivateBtn");

let username = null;
let friends = new Set();
let currentPrivateChat = null;

function enableLoginBtn() {
  loginBtn.disabled = usernameInput.value.trim().length === 0;
}

usernameInput.addEventListener("input", enableLoginBtn);

loginBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  if (!name) return;
  username = name;
  socket.emit("register", username);
  loginContainer.classList.add("hidden");
  appContainer.classList.remove("hidden");
  currentUserEl.textContent = `Logged in as: ${username}`;

  // Load user list for friend adding
  socket.emit("getUsers");
});

sendPublicBtn.addEventListener("click", sendPublicMessage);
publicInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendPublicMessage();
});

sendPrivateBtn.addEventListener("click", sendPrivateMessage);
privateInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendPrivateMessage();
});

function sendPublicMessage() {
  const msg = publicInput.value.trim();
  if (!msg) return;
  socket.emit("sendPublicMessage", msg);
  publicInput.value = "";
}

function sendPrivateMessage() {
  const msg = privateInput.value.trim();
  if (!msg || !currentPrivateChat) return;
  socket.emit("sendPrivateMessage", { to: currentPrivateChat, message: msg });
  privateInput.value = "";
}

socket.on("publicMessage", ({ from, message, timestamp }) => {
  addMessageToChat(publicChat, from, message, timestamp, from === username);
});

socket.on("privateMessage", ({ from, to, message, timestamp }) => {
  if (from === username) {
    // Sent message, show only if private chat opened with friend
    if (to === currentPrivateChat) {
      addMessageToChat(privateChat, from, message, timestamp, true);
    }
  } else {
    // Incoming message
    if (from === currentPrivateChat) {
      addMessageToChat(privateChat, from, message, timestamp, false);
    } else {
      // If message from another friend, optionally highlight friend in friendsList
      // TODO: add notifications
    }
  }
});

socket.on("userList", (users) => {
  renderUsers(users);
});

socket.on("friendAdded", (friendName) => {
  friends.add(friendName);
  renderFriends();
});

function renderUsers(users) {
  // Filter out self and existing friends from clickable "add friend" list
  // We will put user names in public chat clickable messages instead

  // Just update public chat users tooltip with friend adding on username click
}

function renderFriends() {
  friendsList.innerHTML = "";
  friends.forEach((f) => {
    const friendDiv = document.createElement("div");
    friendDiv.classList.add("friendItem");
    friendDiv.textContent = f;
    friendDiv.onclick = () => openPrivateChat(f);
    friendsList.appendChild(friendDiv);
  });
}

function addMessageToChat(container, from, message, timestamp, own = false) {
  const messageEl = document.createElement("div");
  messageEl.classList.add("chatMessage");
  if (own) messageEl.classList.add("own");

  // Username clickable for adding friends only in public chat
  if (container === publicChat) {
    const usernameSpan = document.createElement("span");
    usernameSpan.classList.add("username");
    usernameSpan.textContent = from;
    usernameSpan.title = "Click to add friend";
    usernameSpan.onclick = () => {
      if (from === username) return;
      if (friends.has(from)) return alert(`${from} is already your friend!`);
      socket.emit("addFriend", from);
    };

    messageEl.appendChild(usernameSpan);
    messageEl.appendChild(document.createTextNode(": " + message));
  } else {
    // Private chat, no clickable username needed
    messageEl.textContent = `${from}: ${message}`;
  }

  // Timestamp small
  const timeSpan = document.createElement("span");
  timeSpan.classList.add("timestamp");
  timeSpan.textContent = formatTimestamp(timestamp);
  messageEl.appendChild(timeSpan);

  container.appendChild(messageEl);
  container.scrollTop = container.scrollHeight;
}

function openPrivateChat(friendName) {
  currentPrivateChat = friendName;
  privateChatWithEl.textContent = friendName;
  privateChatSection.classList.remove("hidden");
  privateChat.innerHTML = "";
}

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
