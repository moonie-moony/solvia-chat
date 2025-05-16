const socket = io();

const usernameModal = document.getElementById("username-modal");
const usernameInput = document.getElementById("username-input");
const usernameSubmit = document.getElementById("username-submit");

const chatContainer = document.getElementById("chat-container");
const chat = document.getElementById("chat");
const input = document.getElementById("message");

const roomNameDisplay = document.getElementById("room-name");

const friendsList = document.getElementById("friends-list");
const friendInput = document.getElementById("friend-input");
const addFriendBtn = document.getElementById("add-friend-btn");

const groupInput = document.getElementById("group-input");
const joinGroupBtn = document.getElementById("join-group-btn");

let username = null;
let currentRoom = "lobby";

usernameSubmit.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  if (name.length > 0) {
    username = name;
    socket.emit("join", username);
    usernameModal.style.display = "none";
    chatContainer.classList.remove("hidden");
    input.disabled = false;
    input.focus();
  }
});

input.addEventListener("keypress", function (e) {
  if (e.key === "Enter" && input.value.trim()) {
    socket.emit("chat message", { message: input.value.trim() });
    input.value = "";
  }
});

addFriendBtn.addEventListener("click", () => {
  const friendName = friendInput.value.trim();
  if (friendName.length > 0) {
    socket.emit("addFriend", friendName);
    friendInput.value = "";
  }
});

joinGroupBtn.addEventListener("click", () => {
  const room = groupInput.value.trim();
  if (room.length > 0) {
    socket.emit("joinRoom", room);
    groupInput.value = "";
  }
});

socket.on("friendAdded", (friendName) => {
  const newFriend = document.createElement("div");
  newFriend.textContent = friendName;
  friendsList.appendChild(newFriend);
});

socket.on("joinedRoom", (roomName) => {
  currentRoom = roomName;
  roomNameDisplay.textContent = `Current Room: ${roomName}`;
  chat.innerHTML = "";
});

socket.on("chat message", function (data) {
  const div = document.createElement("div");
  div.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
});
