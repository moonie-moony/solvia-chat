(() => {
  const loginScreen = document.getElementById('loginScreen');
  const chatScreen = document.getElementById('chatScreen');
  const usernameInput = document.getElementById('usernameInput');
  const joinBtn = document.getElementById('joinBtn');
  const messages = document.getElementById('messages');
  const messageForm = document.getElementById('messageForm');
  const messageInput = document.getElementById('messageInput');

  let ws;
  let username = null;

  function addMessage(text, user = null, system = false) {
    const li = document.createElement('li');
    li.classList.add('message');
    if (system) {
      li.classList.add('system');
      li.textContent = text;
    } else {
      const userSpan = document.createElement('span');
      userSpan.className = 'username';
      userSpan.textContent = user || 'Unknown';
      li.appendChild(userSpan);

      const textNode = document.createTextNode(text);
      li.appendChild(textNode);
    }
    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight;
  }

  function connectWebSocket() {
    ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`);

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ type: 'join', username }));
    });

    ws.addEventListener('message', (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.type === 'system') {
        addMessage(data.text, null, true);
      }
      if (data.type === 'chat') {
        addMessage(data.text, data.user.username);
      }
    });

    ws.addEventListener('close', () => {
      addMessage('Disconnected from server.', null, true);
    });
  }

  joinBtn.addEventListener('click', () => {
    const name = usernameInput.value.trim();
    if (!name) return alert('Please enter a username');
    username = name;
    loginScreen.classList.remove('active');
    chatScreen.classList.add('active');
    connectWebSocket();
  });

  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!messageInput.value.trim()) return;
    ws.send(JSON.stringify({ type: 'chat', text: messageInput.value.trim() }));
    messageInput.value = '';
  });
})();
