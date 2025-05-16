const socket = io();

const usernameModal = document.getElementById("username-modal");
const usernameInput = document.getElementById("username-input");
const usernameSubmit = document.getElementById("username-submit");

const chatContainer = document.getElementById("chat-container");
const chat = document.getElementById("chat");
const input = document.getElementById("message");

const roomNameDisplay = document.createElement("div");
roomNameDisplay.className = "mb-2 text-center text-pink-300 font-semibold";
chatContainer.insertBefore(roomNameDisplay, chat);

const friendsList = document.createElement("div");
friendsList.className = "mb-2 p-2 bg-black bg-opacity-30 rounded max-h-24 overflow-auto";
friendsList.innerHTML = "<strong>Friends:</strong><br>";
chatContainer.insertBefore(friendsList, input);

const friendInput = document.createElement("input");
friendInput.type = "text";
friendInput.placeholder = "Add friend username";
friendInput.className = "w-full p-2 rounded mb-2 text-black";
chatContainer.insertBefore(friendInput, input);

const addFriendBtn = document.createElement("button");
addFriendBtn.textContent = "Add Friend";
addFriendBtn.className = "bg-pink-600 px-4 py-2 rounded mb-4 hover:bg-pink-700";
chatContainer.insertBefore(addFriendBtn, input);

const groupInput = document.createElement("input");
groupInput.type = "text";
groupInput.placeholder = "Join/Create group room";
groupInput.className = "w-full p-2 rounded mb-2 text-black";
chatContainer.insertBefore(groupInput, input);

const joinGroupBtn = document.createElement("button");
joinGroupBtn.textContent = "Join Group";
joinGroupBtn.className = "bg-pink-600 px-4 py-2 rounded mb-4 hover:bg-pink-700";
chatContainer.insertBefore(joinGroupBtn, input);

let username = null;
let currentRoom = null;

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
  chat.innerHTML = ""; // Clear chat when switching rooms
});

socket.on("chat message", function (data) {
  const div = document.createElement("div");
  div.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
});
