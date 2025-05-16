const socket = io();
const chat = document.getElementById("chat");
const input = document.getElementById("message");

input.addEventListener("keypress", function (e) {
  if (e.key === "Enter" && input.value.trim()) {
    socket.emit("chat message", input.value.trim());
    input.value = "";
  }
});

socket.on("chat message", function (msg) {
  const div = document.createElement("div");
  div.textContent = msg;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
});
