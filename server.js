const WebSocket = require('ws');
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public')); // public folder with html/css/js

// Keep track of connected clients and users
const clients = new Map();

wss.on('connection', (ws) => {
  let user = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'join' && data.user) {
        user = data.user;
        clients.set(ws, user);

        // Broadcast join message
        broadcast({
          type: 'system',
          text: `${user.username} joined the chat.`,
        });
        return;
      }

      if (data.type === 'chat' && user) {
        broadcast({
          type: 'chat',
          user,
          text: data.text
        });
        return;
      }
    } catch (err) {
      console.error('Error parsing message:', err);
    }
  });

  ws.on('close', () => {
    if (user) {
      clients.delete(ws);
      broadcast({
        type: 'system',
        text: `${user.username} left the chat.`,
      });
    }
  });
});

function broadcast(data) {
  const message = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
