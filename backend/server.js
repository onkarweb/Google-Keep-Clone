// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: { origin: '*' } // allow all origins for development
});
const port = 3000;

let noteContent = ''; // in-memory note storage

app.get('/', (req, res) => {
  res.send('Welcome to Backend!');
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Send the current note content to the newly connected client
  socket.emit('noteUpdate', noteContent);

    // Listen for note updates from this client
    socket.on('updateNote', (content) => {
        noteContent = content;
        // Broadcast the updated note to all other connected clients
        socket.broadcast.emit('noteUpdate', noteContent);
    });

    // Listen for cursor updates from this client
    socket.on('cursorUpdate', (data) => {
        // data contains { x, y, icon }
        // Broadcast to all other clients along with the sender's id
        socket.broadcast.emit('cursorUpdate', { userId: socket.id, ...data });
        console.log("CursorUpdate Received & Emitted")
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});



http.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
