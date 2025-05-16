const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') filePath = './public/index.html';

  const extname = path.extname(filePath);
  const contentType = extname === '.js' ? 'text/javascript' :
                      extname === '.css' ? 'text/css' :
                      'text/html';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end('Not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'join') {
        ws.username = data.username;
        ws.send(JSON.stringify({ type: 'system', text: `Welcome ${data.username}!` }));
        broadcast(JSON.stringify({ type: 'system', text: `${data.username} joined the chat.` }), ws);
      } else if (data.type === 'chat') {
        const chatMessage = JSON.stringify({
          type: 'chat',
          user: { username: ws.username || 'Unknown' },
          text: data.text,
        });
        broadcast(chatMessage);
      }
    } catch (e) {
      console.error('Invalid message', e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    if (ws.username) {
      broadcast(JSON.stringify({ type: 'system', text: `${ws.username} left the chat.` }));
    }
  });
});

function broadcast(message, exclude) {
  clients.forEach(client => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
