const ws = new WebSocket(`ws://${window.location.host}`);

const joinSection = document.getElementById('join-section');
const chatSection = document.getElementById('chat-section');

const usernameInput = document.getElementById('username-input');

const joinBtn = document.getElementById('join-btn');
const chatBox = document.getElementById('chat-box');

const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

let currentUser = null;

joinBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();

  if (!username) {
    alert('Please enter a username.');
    return;
  }

  currentUser = { username };

  ws.send(JSON.stringify({
    type: 'join',
    user: currentUser
  }));

  joinSection.classList.add('hidden');
  chatSection.classList.remove('hidden');

  addMessage(`System: Welcome ${username}!`);
});

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  ws.send(JSON.stringify({
    type: 'chat',
    user: currentUser,
    text
  }));

  chatInput.value = '';
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'system') {
    addMessage(`System: ${data.text}`);
  } else if (data.type === 'chat') {
    addMessage(`${data.user.username}: ${data.text}`);
  }
};

ws.onopen = () => {
  console.log('Connected to chat server');
};

ws.onerror = (err) => {
  console.error('WebSocket error:', err);
};

function addMessage(message) {
  const msg = document.createElement('div');
  msg.textContent = message;
  msg.style.animation = 'fadeIn 0.4s ease forwards';
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}
