import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = 3003;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Track online users
const onlineUsers = new Map<string, string>(); // userId -> socketId

io.on('connection', (socket) => {
  console.log(`[EcoRDC Chat] Client connected: ${socket.id}`);

  // User comes online
  socket.on('user:online', (userId: string) => {
    onlineUsers.set(userId, socket.id);
    io.emit('users:online', Array.from(onlineUsers.keys()));
    console.log(`[EcoRDC Chat] User online: ${userId}`);
  });

  // Send message
  socket.on('message:send', (data: {
    senderId: string;
    receiverId: string;
    content: string;
    attachment?: string;
  }) => {
    // Broadcast to receiver if online
    const receiverSocketId = onlineUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('message:receive', {
        ...data,
        createdAt: new Date().toISOString(),
      });
    }
    // Confirm to sender
    socket.emit('message:sent', {
      ...data,
      createdAt: new Date().toISOString(),
    });
  });

  // Typing indicator
  socket.on('typing:start', (data: { senderId: string; receiverId: string }) => {
    const receiverSocketId = onlineUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing:incoming', { senderId: data.senderId });
    }
  });

  socket.on('typing:stop', (data: { senderId: string; receiverId: string }) => {
    const receiverSocketId = onlineUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing:stopped', { senderId: data.senderId });
    }
  });

  // Notification
  socket.on('notification:send', (data: { userId: string; title: string; message: string }) => {
    const userSocketId = onlineUsers.get(data.userId);
    if (userSocketId) {
      io.to(userSocketId).emit('notification:new', data);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    // Remove from online users
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit('users:online', Array.from(onlineUsers.keys()));
        console.log(`[EcoRDC Chat] User offline: ${userId}`);
        break;
      }
    }
    console.log(`[EcoRDC Chat] Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[EcoRDC Chat] Socket.IO server running on port ${PORT}`);
});
