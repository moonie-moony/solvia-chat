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
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf8');
  });
});

const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    if (data.type === 'join') {
      ws.username = data.username || 'Unknown';
      ws.send(JSON.stringify({ type: 'system', text: `Welcome ${ws.username}!` }));
      broadcast({ type: 'system', text: `${ws.username} joined the chat.` }, ws);
    }

    if (data.type === 'chat' && ws.username) {
      broadcast({
        type: 'chat',
        user: { username: ws.username },
        text: data.text
      });
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    if (ws.username) {
      broadcast({ type: 'system', text: `${ws.username} left the chat.` });
    }
  });
});

function broadcast(msg, exclude) {
  const message = JSON.stringify(msg);
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
