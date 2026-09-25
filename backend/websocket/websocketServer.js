const { WebSocketServer, WebSocket } = require('ws');

function createWebSocketServer() {
  let latestLead = null;
  const wss = new WebSocketServer({ port: 8080 });

  wss.on('connection', (socket) => {
    console.log('React Native connected via WebSocket');
    if (latestLead) {
  socket.send(JSON.stringify(latestLead));
}
  });

  function broadcastLead(lead) {
     console.log('Connected WebSocket clients:', wss.clients.size);
     latestLead = lead;
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(lead));
      }
    });
  }

  return {
    wss,
    broadcastLead
  };
}



module.exports = { createWebSocketServer };