const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });

const clients = new Map();

wss.on('connection', (ws) => {
  let user = null;

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === 'join' && data.user) {
        user = data.user;
        clients.set(ws, user);
        broadcast({ type: 'system', text: `${user.username} joined the chat.` }, ws);
      } else if (data.type === 'chat' && user) {
        const chatMsg = {
          type: 'chat',
          user,
          text: data.text
        };
        broadcast(chatMsg);
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    if (user) {
      clients.delete(ws);
      broadcast({ type: 'system', text: `${user.username} left the chat.` });
    }
  });
});

function broadcast(data, exclude) {
  const str = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN && client !== exclude) {
      client.send(str);
    }
  }
}
