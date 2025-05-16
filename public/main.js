const userForm = document.getElementById('user-form');
const usernameInput = document.getElementById('username');
const birthdayInput = document.getElementById('birthday');
const chatSection = document.getElementById('chat-section');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

let currentUser = null;
let socket = null;

// Check if user is at least 13
function isOldEnough(birthday) {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 13;
}

userForm.addEventListener('submit', e => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const birthday = birthdayInput.value;
  if (!username || !birthday) return;

  if (!isOldEnough(birthday)) {
    alert('You must be at least 13 years old to join this chat.');
    return;
  }

  currentUser = { username, birthday };

  // Connect websocket
  socket = new WebSocket(`ws://${location.host}`);

  socket.addEventListener('open', () => {
    // Send join message with user data
    socket.send(JSON.stringify({ type: 'join', user: currentUser }));

    userForm.style.display = 'none';
    chatSection.style.display = 'flex';
    messageForm.style.display = 'flex';

    appendSystemMessage(`Welcome, ${username}! You joined the chat.`);
    messageInput.focus();
  });

  socket.addEventListener('message', event => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'chat') {
        appendMessage(data.user.username, data.user.birthday, data.text);
      } else if (data.type === 'system') {
        appendSystemMessage(data.text);
      }
    } catch {
      console.warn('Invalid message', event.data);
    }
  });

  socket.addEventListener('close', () => {
    appendSystemMessage('Connection closed.');
    sendBtn.disabled = true;
  });

  socket.addEventListener('error', () => {
    appendSystemMessage('Connection error.');
    sendBtn.disabled = true;
  });
});

messageInput.addEventListener('input', () => {
  sendBtn.disabled = messageInput.value.trim().length === 0;
});

messageForm.addEventListener('submit', e => {
  e.preventDefault();
  const msg = messageInput.value.trim();
  if (!msg || !socket || socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify({ type: 'chat', text: msg }));

  messageInput.value = '';
  sendBtn.disabled = true;
  chatSection.scrollTop = chatSection.scrollHeight;
});

function appendMessage(username, birthday, text) {
  const msgEl = document.createElement('div');
  msgEl.classList.add('message');

  const userEl = document.createElement('div');
  userEl.classList.add('username');
  userEl.textContent = username;

  const birthdayEl = document.createElement('div');
  birthdayEl.classList.add('birthday');
  birthdayEl.textContent = `Birthday: ${birthday}`;

  const textEl = document.createElement('div');
  textEl.textContent = text;

  msgEl.appendChild(userEl);
  msgEl.appendChild(birthdayEl);
  msgEl.appendChild(textEl);

  chatSection.appendChild(msgEl);
  chatSection.scrollTop = chatSection.scrollHeight;
}

function appendSystemMessage(text) {
  const sysMsg = document.createElement('div');
  sysMsg.classList.add('message');
  sysMsg.style.background = 'rgba(255,255,255,0.15)';
  sysMsg.style.fontStyle = 'italic';
  sysMsg.style.color = '#ccc';
  sysMsg.textContent = text;
  chatSection.appendChild(sysMsg);
  chatSection.scrollTop = chatSection.scrollHeight;
}
