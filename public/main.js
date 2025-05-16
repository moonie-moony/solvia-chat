const socket = io();

const usernameModal = document.getElementById("username-modal");
const usernameInput = document.getElementById("username-input");
const usernameSubmit = document.getElementById("username-submit");

const chatContainer = document.getElementById("chat-container");
const chat = document.getElementById("chat");
const input = document.getElementById("message");

let username = null;

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
    socket.emit("chat message", { username, message: input.value.trim() });
    input.value = "";
  }
});

socket.on("chat message", function (data) {
  const div = document.createElement("div");
  div.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
});
