import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import User from './models/User.js';
import Message from './models/Message.js';
import Booking from './models/Booking.js';
import Blog from './models/Blog.js';

dotenv.config();

const app = express();
app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: wss: data: blob:;");
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const httpServer = createServer(app);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_HERE',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_SECRET_HERE',
});

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    
    // Auto-seed default blogs if empty
    const blogCount = await Blog.countDocuments();
    if (blogCount === 0) {
      await Blog.insertMany([
        { title: "Understanding Planetary Transits in 2026", excerpt: "Astro Dilip Sharma explains how the major transits of Saturn and Jupiter will impact your sun sign this year...", date: "May 15, 2026", author: "Astro Dilip Sharma", image: "/courses/new-planetary transits.png" },
        { title: "How Vastu Changed My Business", excerpt: "After struggling for years, applying simple Vastu remedies suggested by Astro Dilip transformed my workspace energy...", date: "May 10, 2026", author: "Priya M. (Client Experience)", image: "/courses/new-vastu.png" },
        { title: "The Power of Lal Kitab Remedies", excerpt: "Why Lal Kitab is considered one of the most practical and effective branches of astrology in the modern era.", date: "May 2, 2026", author: "Astro Dilip Sharma", image: "/courses/new-lalkitab.jpg" }
      ]);
      console.log('Default blogs seeded automatically.');
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Prevent Render free tier from sleeping
setInterval(() => {
  fetch('https://astrodilip-webapp.onrender.com/api/online-users')
    .then(() => console.log('Keep-alive ping sent'))
    .catch(() => console.log('Keep-alive ping failed'));
}, 14 * 60 * 1000);

// Active socket users
const activeUsers = new Map();

// ----- API ENDPOINTS -----

app.get('/api/online-users', (req, res) => {
  res.status(200).json({ status: 'ok', count: activeUsers.size });
});

app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: 'Email already registered.' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    
    const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ 
      message: 'User registered successfully', 
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during signup' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(200).json({ 
      message: 'Login successful', 
      token,
      user: { id: user._id, name: user.name, email: user.email } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.post('/api/admin-login', (req, res) => {
  const { password } = req.body;
  if (password === 'admin123' || password === '1234') {
    const token = jwt.sign({ id: 'admin', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ message: 'Admin login successful', token });
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
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);
    await Message.deleteMany({ $or: [{ from: userId }, { to: userId }] });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.get('/api/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' }).sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

app.get('/api/blogs/all', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all blogs' });
  }
});

app.post('/api/blogs', async (req, res) => {
  try {
    const newBlog = new Blog(req.body);
    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create blog' });
  }
});

app.put('/api/blogs/:id/publish', async (req, res) => {
  try {
    await Blog.findByIdAndUpdate(req.params.id, { status: 'published' });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish blog' });
  }
});

app.put('/api/blogs/:id', async (req, res) => {
  try {
    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedBlog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update blog' });
  }
});

app.delete('/api/blogs/:id', async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete blog' });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const completedSessions = await Booking.countDocuments({ status: 'completed' });
    
    const revenueResult = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('userName date timeSlot consultationType amount status');
      
    res.status(200).json({
      totalUsers,
      totalBookings,
      completedSessions,
      totalRevenue,
      recentBookings
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/bookings/admin/all', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.put('/api/bookings/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.status(200).json({ message: 'Booking status updated', booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

app.get('/api/messages/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const messages = await Message.find({ $or: [{ from: userId }, { to: userId }] }).sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date is required' });
    
    // Find confirmed or pending bookings for this date
    const bookings = await Booking.find({ date, status: { $in: ['pending', 'confirmed'] } });
    const bookedTimes = bookings.map(b => b.timeSlot);

    const standardSlots = [
      '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
      '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'
    ];

    const slots = standardSlots.map(time => ({
      time,
      available: !bookedTimes.includes(time)
    }));

    res.status(200).json({ slots });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.get('/api/bookings/user/:userId', async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
    await newBooking.save();
    res.status(201).json({ message: 'Booking created successfully', booking: newBooking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

app.put('/api/bookings/:id', async (req, res) => {
  try {
    const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ message: 'Booking updated', booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// ----- RAZORPAY LOGIC -----

app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt = 'receipt#1' } = req.body;
    const options = {
      amount: amount * 100, // amount in smallest currency unit
      currency,
      receipt
    };
    const order = await razorpay.orders.create(options);
    if (!order) return res.status(500).send("Some error occured");
    res.json(order);
  } catch (error) {
    console.error('Error creating razorpay order:', error);
    res.status(500).send(error);
  }
});

app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingData } = req.body;
    
    const sha = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'YOUR_SECRET_HERE');
    sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = sha.digest("hex");
    
    if (digest !== razorpay_signature) {
      return res.status(400).json({ error: "Transaction is not legit!" });
    }
    
    const newBooking = new Booking({
      ...bookingData,
      paymentStatus: 'paid',
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id
    });
    await newBooking.save();
    
    res.json({
      message: "success",
      booking: newBooking,
      paymentId: razorpay_payment_id
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).send(error);
  }
});

// ----- SOCKET.IO LOGIC -----

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins with a role: 'client' or 'admin'
  socket.on('join', async ({ role, name, userId, consultationType }) => {
    socket.join(role);
    const user = { id: socket.id, role, name: name || 'Anonymous', userId: userId || socket.id, consultationType: consultationType || 'chat' };
    activeUsers.set(socket.id, user);
    console.log(`${role} joined: ${user.name} (${socket.id})`);

    try {
      if (role === 'admin') {
        // Kick any existing admin session to prevent duplicate admin sockets
        const existingAdmin = Array.from(activeUsers.values()).find(
          u => u.role === 'admin' && u.id !== socket.id
        );
        if (existingAdmin) {
          console.log('Kicking old admin session:', existingAdmin.id);
          io.to(existingAdmin.id).emit('force_disconnect');
          activeUsers.delete(existingAdmin.id);
        }

        const clients = Array.from(activeUsers.values()).filter(u => u.role === 'client');
        const messages = await Message.find().sort({ timestamp: 1 });
        socket.emit('admin_init', { clients, messages });
        io.to('client').emit('admin_socket_id', { socketId: socket.id });
      } else {
        io.to('admin').emit('client_joined', user);
        const clientMessages = await Message.find({ $or: [{ from: user.userId }, { to: user.userId }] }).sort({ timestamp: 1 });
        socket.emit('client_init', { messages: clientMessages });
        
        const adminUser = Array.from(activeUsers.values()).find(u => u.role === 'admin');
        if (adminUser) {
          socket.emit('admin_socket_id', { socketId: adminUser.id });
        }
      }
    } catch (err) {
      console.error('Error during socket join initialization:', err);
    }
  });

  // Handle chat messages
  socket.on('send_message', async (data) => {
    const sender = activeUsers.get(socket.id);
    if (!sender) return;

    try {
      const newMessage = new Message({
        text: data.text,
        file: data.file,
        from: sender.userId,
        senderName: sender.name,
        to: data.to || 'admin'
      });
      await newMessage.save();

      const messageObj = newMessage.toObject();
      messageObj.id = messageObj._id;

      if (sender.role === 'client') {
        io.to('admin').emit('receive_message', messageObj);
        socket.emit('receive_message', messageObj);
      } else if (sender.role === 'admin') {
        const client = Array.from(activeUsers.values()).find(u => u.userId === data.to);
        if (client) {
          io.to(client.id).emit('receive_message', messageObj);
        }
        socket.emit('receive_message', messageObj);
      }
    } catch (err) {
      console.error('Error saving message:', err);
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
  // SESSION REMINDER
  // =============================================
  socket.on('session_reminder', ({ targetUserId, bookingId, message, consultationType }) => {
    // Find the client socket by userId
    const targetClient = Array.from(activeUsers.values()).find(
      u => u.userId === targetUserId
    );
    if (targetClient) {
      io.to(targetClient.id).emit('session_reminder', {
        bookingId,
        message,
        consultationType
      });
      socket.emit('reminder_sent', { success: true });
    } else {
      socket.emit('reminder_sent', { 
        success: false, 
        message: 'User is not currently online' 
      });
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

// Serve frontend in production (Single Deployment)
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO Server running on port ${PORT}`);
});
