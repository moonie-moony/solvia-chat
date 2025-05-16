const joinForm = document.getElementById('join-form');
const usernameInput = document.getElementById('username-input');
const joinBtn = document.getElementById('join-btn');
const chatContainer = document.getElementById('chat-container');
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

let currentUser = null;
let socket = null;

function addMessage(message, options = {}) {
  const msg = document.createElement('div');
  msg.classList.add('message');
  if (options.system) msg.classList.add('system');
  if (options.self) msg.classList.add('self');
  msg.textContent = message;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function connectSocket(username) {
  socket = new WebSocket('ws://' + window.location.host);

  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ type: 'join', username }));
  });

  socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'system') {
      addMessage(data.text, { system: true });
    }
    if (data.type === 'chat') {
      const isSelf = data.user.username === currentUser.username;
      addMessage(`${data.user.username}: ${data.text}`, { self: isSelf });
    }
  });

  socket.addEventListener('close', () => {
    addMessage('Disconnected from server.', { system: true });
  });

  socket.addEventListener('error', () => {
    addMessage('Connection error.', { system: true });
  });
}

joinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  if (!username) return alert('Please enter a username');
  currentUser = { username };
  joinForm.style.display = 'none';
  chatContainer.style.display = 'flex';
  connectSocket(username);
  addMessage(`Welcome ${username}!`, { system: true });
});

sendBtn.addEventListener('click', () => {
  sendMessage();
});

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: 'chat', text }));
  messageInput.value = '';
}
