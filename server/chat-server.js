const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // msgData = { name: 'UserName', text: 'message' }
  socket.on('chat message', (msgData) => {
    if (!msgData || !msgData.text) return;
    // Broadcast to everyone except sender
    socket.broadcast.emit('chat message', msgData);
  });

  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

server.listen(4000, () => console.log('Chat server running on port 4000'));
