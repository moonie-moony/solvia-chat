const socket = io();
let username = "";
let friends = [];
let friendRequests = [];

const loginContainer = document.getElementById("loginContainer");
const loginBtn = document.getElementById("loginBtn");
const usernameInput = document.getElementById("usernameInput");

const appContainer = document.getElementById("appContainer");
const publicChat = document.getElementById("publicChat");
const privateChat = document.getElementById("privateChat");
const publicInput = document.getElementById("publicInput");
const privateInput = document.getElementById("privateInput");

const sendPublicBtn = document.getElementById("sendPublicBtn");
const sendPrivateBtn = document.getElementById("sendPrivateBtn");

const currentUser = document.getElementById("currentUser");
const friendRequestsDiv = document.getElementById("friendRequests");
const friendsListDiv = document.getElementById("friendsList");
const privateChatWith = document.getElementById("privateChatWith");
const privateChatSection = document.getElementById("privateChatSection");

let currentPrivateTarget = null;

usernameInput.addEventListener("input", () => {
  loginBtn.disabled = usernameInput.value.trim() === "";
});

loginBtn.addEventListener("click", () => {
  username = usernameInput.value.trim();
  if (!username) return;
  socket.emit("login", username);
  currentUser.textContent = `You: ${username}`;
  loginContainer.classList.add("hidden");
  appContainer.classList.remove("hidden");
});

sendPublicBtn.addEventListener("click", () => {
  const msg = publicInput.value.trim();
  if (msg) {
    socket.emit("publicMessage", msg);
    publicInput.value = "";
  }
});

sendPrivateBtn.addEventListener("click", () => {
  const msg = privateInput.value.trim();
  if (msg && currentPrivateTarget) {
    socket.emit("privateMessage", {
      to: currentPrivateTarget,
      message: msg,
    });
    displayPrivateMessage(username, msg, true);
    privateInput.value = "";
  }
});

function displayPublicMessage(sender, message) {
  const div = document.createElement("div");
  div.className = "message " + (sender === username ? "self" : "other");
  div.textContent = `${sender}: ${message}`;
  publicChat.appendChild(div);
  publicChat.scrollTop = publicChat.scrollHeight;
}

function displayPrivateMessage(sender, message, self = false) {
  const div = document.createElement("div");
  div.className = "message " + (self ? "self" : "other");
  div.textContent = `${sender}: ${message}`;
  privateChat.appendChild(div);
  privateChat.scrollTop = privateChat.scrollHeight;
}

socket.on("publicMessage", ({ sender, message }) => {
  displayPublicMessage(sender, message);
});

socket.on("privateMessage", ({ from, message }) => {
  if (currentPrivateTarget === from) {
    displayPrivateMessage(from, message, false);
  }
});

socket.on("friendRequest", (from) => {
  friendRequests.push(from);
  renderFriendRequests();
});

socket.on("friendListUpdate", (newList) => {
  friends = newList;
  renderFriends();
});

function renderFriendRequests() {
  friendRequestsDiv.innerHTML = "";
  friendRequests.forEach((req) => {
    const btn = document.createElement("button");
    btn.className = "friend-btn";
    btn.textContent = `Accept ${req}`;
    btn.onclick = () => {
      socket.emit("acceptFriend", req);
      friendRequests = friendRequests.filter((r) => r !== req);
      renderFriendRequests();
    };
    friendRequestsDiv.appendChild(btn);
  });
}

function renderFriends() {
  friendsListDiv.innerHTML = "";
  friends.forEach((f) => {
    const btn = document.createElement("button");
    btn.className = "friend-btn";
    btn.textContent = f;
    btn.onclick = () => {
      currentPrivateTarget = f;
      privateChatWith.textContent = f;
      privateChat.innerHTML = "";
      privateChatSection.classList.remove("hidden");
    };
    friendsListDiv.appendChild(btn);
  });
}
