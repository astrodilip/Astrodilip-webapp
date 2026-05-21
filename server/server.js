import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Simple in-memory storage
const activeUsers = new Map();
const messages = [];
const usersDB = [];

// ----- API ENDPOINTS -----

app.post('/api/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  const exists = usersDB.find(u => u.email === email);
  if (exists) {
    return res.status(400).json({ error: 'Email already registered.' });
  }
  const newUser = { id: 'user_' + Date.now(), name, email, password };
  usersDB.push(newUser);
  res.status(201).json({ message: 'User registered successfully', user: { id: newUser.id, name: newUser.name, email: newUser.email } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = usersDB.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  res.status(200).json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/admin-login', (req, res) => {
  const { password } = req.body;
  if (password === 'admin123' || password === '1234') {
    res.status(200).json({ message: 'Admin login successful' });
  } else {
    res.status(401).json({ error: 'Invalid admin credentials.' });
  }
});

app.get('/api/online-users', (req, res) => {
  const online = Array.from(activeUsers.values()).map(u => ({
    id: u.userId,
    name: u.name,
    role: u.role
  }));
  res.status(200).json({ onlineUsers: online });
});

// ----- SOCKET.IO LOGIC -----

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins with a role: 'client' or 'admin'
  socket.on('join', ({ role, name, userId }) => {
    socket.join(role);
    const user = { id: socket.id, role, name: name || 'Anonymous', userId: userId || socket.id };
    activeUsers.set(socket.id, user);
    console.log(`${role} joined: ${user.name} (${socket.id})`);

    if (role === 'admin') {
      const clients = Array.from(activeUsers.values()).filter(u => u.role === 'client');
      socket.emit('admin_init', { clients, messages });
      io.to('client').emit('admin_socket_id', { socketId: socket.id });
    } else {
      io.to('admin').emit('client_joined', user);
      const clientMessages = messages.filter(m => m.from === user.userId || m.to === user.userId);
      socket.emit('client_init', { messages: clientMessages });
      
      const adminUser = Array.from(activeUsers.values()).find(u => u.role === 'admin');
      if (adminUser) {
        socket.emit('admin_socket_id', { socketId: adminUser.id });
      }
    }
  });

  // Handle chat messages
  socket.on('send_message', (data) => {
    const sender = activeUsers.get(socket.id);
    if (!sender) return;

    const message = {
      id: Date.now().toString(),
      text: data.text,
      file: data.file,
      from: sender.userId,
      senderName: sender.name,
      to: data.to || 'admin',
      timestamp: new Date().toISOString()
    };

    messages.push(message);

    if (sender.role === 'client') {
      io.to('admin').emit('receive_message', message);
      socket.emit('receive_message', message);
    } else if (sender.role === 'admin') {
      const client = Array.from(activeUsers.values()).find(u => u.userId === data.to);
      if (client) {
        io.to(client.id).emit('receive_message', message);
      }
      socket.emit('receive_message', message);
    }
  });

  // =============================================
  // WEBRTC SIGNALING EVENTS
  // =============================================

  // Admin calls a specific client (or client calls admin)
  // callType: 'video' or 'audio'
  socket.on('call_user', ({ targetSocketId, callType, callerName }) => {
    const caller = activeUsers.get(socket.id);
    if (!caller) return;

    console.log(`Call request: ${caller.name} -> ${targetSocketId} [${callType}]`);

    if (caller.role === 'admin') {
      // Admin is calling a client
      if (targetSocketId) {
        io.to(targetSocketId).emit('incoming_call', {
          callerId: caller.userId,
          callerName: callerName || caller.name,
          callType,
          callerSocketId: socket.id
        });
      } else {
        socket.emit('call_error', { message: 'User is not online.' });
      }
    } else {
      // Client is calling admin
      io.to('admin').emit('incoming_call', {
        callerId: caller.userId,
        callerName: callerName || caller.name,
        callType,
        callerSocketId: socket.id
      });
    }
  });

  // Called user accepts the call
  socket.on('accept_call', ({ callerSocketId, callType }) => {
    const accepter = activeUsers.get(socket.id);
    console.log(`Call accepted by ${accepter?.name}`);
    io.to(callerSocketId).emit('call_accepted', {
      accepterSocketId: socket.id,
      accepterName: accepter?.name,
      callType
    });
  });

  // Called user rejects the call
  socket.on('reject_call', ({ callerSocketId }) => {
    const rejecter = activeUsers.get(socket.id);
    console.log(`Call rejected by ${rejecter?.name}`);
    io.to(callerSocketId).emit('call_rejected', {
      rejectedBy: rejecter?.name
    });
  });

  // WebRTC Offer (sent by caller after call_accepted)
  socket.on('webrtc_offer', ({ targetSocketId, offer }) => {
    console.log(`WebRTC offer from ${socket.id} to ${targetSocketId}`);
    io.to(targetSocketId).emit('webrtc_offer', {
      offer,
      callerSocketId: socket.id
    });
  });

  // WebRTC Answer (sent by callee)
  socket.on('webrtc_answer', ({ targetSocketId, answer }) => {
    console.log(`WebRTC answer from ${socket.id} to ${targetSocketId}`);
    io.to(targetSocketId).emit('webrtc_answer', {
      answer,
      answererSocketId: socket.id
    });
  });

  // ICE Candidates (both sides send these)
  socket.on('ice_candidate', ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit('ice_candidate', {
      candidate,
      senderSocketId: socket.id
    });
  });

  // End call
  socket.on('end_call', ({ targetSocketId }) => {
    const ender = activeUsers.get(socket.id);
    console.log(`Call ended by ${ender?.name}`);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call_ended');
    }
  });

  // =============================================
  // DISCONNECT
  // =============================================
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      console.log(`User disconnected: ${user.name} (${socket.id})`);
      if (user.role === 'client') {
        io.to('admin').emit('client_left', user.userId);
      }
      activeUsers.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO Server running on port ${PORT}`);
});
