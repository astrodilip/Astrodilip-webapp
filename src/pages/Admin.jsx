import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, User, Phone, Video, MoreVertical, Paperclip, Smile, X, FileText, CheckCheck, Users, Calendar, BarChart3, Search, Trash2, CheckCircle, XCircle, Eye, Bell, Clock } from 'lucide-react';
import VideoCall from '../components/VideoCall';
import CallNotification from '../components/CallNotification';
import './Chat.css';

const socket = io('https://astrodilip-webapp.onrender.com');

const STICKERS = [
  'https://cdn-icons-png.flaticon.com/128/3306/3306619.png',
  'https://cdn-icons-png.flaticon.com/128/4156/4156821.png',
  'https://cdn-icons-png.flaticon.com/128/3306/3306560.png',
  'https://cdn-icons-png.flaticon.com/128/3306/3306528.png',
];

const EMOJIS = ['ðŸ˜Š', 'ðŸ˜‚', 'ðŸ¥º', 'ðŸ™', 'â¤ï¸', 'ðŸ‘', 'âœ¨', 'ðŸ”¥', 'ðŸ™Œ', 'ðŸ’¯', 'ðŸ”®', 'ðŸ•‰ï¸'];

const Admin = () => {
  const [clients, setClients] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeClient, setActiveClient] = useState(null);
  const [inputMsg, setInputMsg] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  // File & Picker States
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState('emoji');

  // â”€â”€ Call States â”€â”€
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  // â”€â”€ New Admin Panel States â”€â”€
  const [activeTab, setActiveTab] = useState('chat');
  const [allUsers, setAllUsers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Blog Tab States
  const [allBlogs, setAllBlogs] = useState([]);
  const [newBlog, setNewBlog] = useState({ title: '', excerpt: '', date: '', author: '', image: '' });
  const [editBlogData, setEditBlogData] = useState(null);
  
  // User Tab States
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeMenuDropdownId, setActiveMenuDropdownId] = useState(null);

  // Booking Tab States
  const [bookingFilter, setBookingFilter] = useState('All');
  const [selectedBookingForModal, setSelectedBookingForModal] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pickerRef = useRef(null);

  // â”€â”€ Auto-Login on Refresh â”€â”€
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      socket.emit('join', { role: 'admin', name: 'Astro Dilip Sharma' });
      setIsJoined(true);
    }
  }, []);

  useEffect(() => {
    socket.on('admin_init', (data) => {
      setClients(data.clients);
      setMessages(data.messages);
    });

    socket.on('client_joined', (client) => {
      setClients((prev) => {
        if (!prev.find((c) => c.userId === client.userId)) {
          return [...prev, client];
        }
        return prev;
      });
    });

    socket.on('client_left', (userId) => {
      setClients((prev) => prev.filter((c) => c.userId !== userId));
    });

    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // â”€â”€ Call Signal Listeners â”€â”€

    // Incoming call from a client
    socket.on('incoming_call', ({ callerSocketId, callerName, callType }) => {
      setIncomingCall({ callerSocketId, callerName, callType });
    });

    // Client rejected our call
    socket.on('call_rejected', () => {
      setActiveCall(null);
      setIncomingCall(null);
      alert('Call was declined by the client.');
    });

    // Client ended the call
    socket.on('call_ended', () => {
      setActiveCall(null);
    });

    socket.on('force_disconnect', () => {
      alert('Another admin session was started. This tab has been logged out.');
      setIsJoined(false);
    });

    return () => {
      socket.off('admin_init');
      socket.off('client_joined');
      socket.off('client_left');
      socket.off('receive_message');
      socket.off('incoming_call');
      socket.off('call_rejected');
      socket.off('call_ended');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeClient, activeTab]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // â”€â”€ Fetch data when tabs change â”€â”€
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'bookings') fetchBookings();
    if (activeTab === 'stats') fetchStats();
    if (activeTab === 'blogs') fetchBlogs();
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://astrodilip-webapp.onrender.com/api/users');
      const data = await res.json();
      setAllUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://astrodilip-webapp.onrender.com/api/bookings/admin/all');
      const data = await res.json();
      setAllBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://astrodilip-webapp.onrender.com/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://astrodilip-webapp.onrender.com/api/blogs/all');
      const data = await res.json();
      setAllBlogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlog = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://astrodilip-webapp.onrender.com/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlog)
      });
      if (res.ok) {
        setNewBlog({ title: '', excerpt: '', date: '', author: '', image: '' });
        fetchBlogs();
        alert('Blog created successfully!');
      } else {
        alert('Error: The live server does not have the blog endpoints yet because we haven\'t pushed to GitHub!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create blog');
    }
  };

  const handleDeleteBlog = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      const res = await fetch(`https://astrodilip-webapp.onrender.com/api/blogs/${id}`, { method: 'DELETE' });
      if (res.ok) fetchBlogs();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublishBlog = async (id) => {
    if (!window.confirm('Are you sure you want to approve and publish this experience to the home page?')) return;
    try {
      const res = await fetch(`https://astrodilip-webapp.onrender.com/api/blogs/${id}/publish`, { method: 'PUT' });
      if (res.ok) {
        fetchBlogs();
        alert('Experience published successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBlog = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`https://astrodilip-webapp.onrender.com/api/blogs/${editBlogData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editBlogData)
      });
      if (res.ok) {
        setEditBlogData(null);
        fetchBlogs();
        alert('Blog updated successfully!');
      } else {
        alert('Failed to update blog on the server.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update blog');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user and all their messages?')) return;
    try {
      const res = await fetch(`https://astrodilip-webapp.onrender.com/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const updateBookingStatus = async (id, status) => {
    if (!window.confirm(`Mark booking as ${status}?`)) return;
    try {
      const res = await fetch(`https://astrodilip-webapp.onrender.com/api/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotifyUser = (booking) => {
    socket.emit('session_reminder', {
      targetUserId: booking.userId,
      bookingId: booking._id,
      message: `Your consultation is starting now! Date: ${booking.date}, Time: ${booking.timeSlot}`,
      consultationType: booking.consultationType
    });
    alert(`Notification sent to ${booking.userName || 'client'}!`);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://astrodilip-webapp.onrender.com/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('adminToken', data.token);
        socket.emit('join', { role: 'admin', name: 'Astro Dilip Sharma' });
        setIsJoined(true);
      } else {
        const data = await response.json();
        alert(data.error || 'Incorrect password');
      }
    } catch (err) {
      alert('Login failed. Ensure backend server is running.');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
    e.target.value = '';
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if ((!inputMsg.trim() && !selectedFile) || !activeClient) return;

    let fileData = null;
    if (selectedFile) {
      fileData = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
      };
      const buffer = await selectedFile.arrayBuffer();
      const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
      fileData.dataUrl = `data:${selectedFile.type};base64,${base64}`;
    }

    socket.emit('send_message', {
      text: inputMsg,
      to: activeClient.userId,
      file: fileData,
    });

    setInputMsg('');
    setSelectedFile(null);
  };

  const sendSticker = (stickerUrl) => {
    if (!activeClient) return;
    socket.emit('send_message', {
      text: '',
      to: activeClient.userId,
      file: { type: 'sticker', dataUrl: stickerUrl, name: 'Sticker' },
    });
    setShowPicker(false);
  };

  // â”€â”€ Initiate a call to the active client â”€â”€
  const startCall = (callType) => {
    if (!activeClient) return;

    // activeClient.id is the socket ID of the client (set when they joined)
    if (!activeClient.id) {
      alert('Client socket ID not available. They may have reconnected.');
      return;
    }

    socket.emit('call_user', {
      targetSocketId: activeClient.id,
      callerName: 'Astro Dilip Sharma',
      callType,
    });

    setActiveCall({
      callType,
      remoteSocketId: activeClient.id,
      remoteUserName: activeClient.name,
      isIncoming: false,
      callerSocketId: null,
    });
  };

  // â”€â”€ Accept incoming call â”€â”€
  const acceptCall = () => {
    if (!incomingCall) return;

    // BUG 2 FIX: Emit accept_call so the caller (client) gets call_accepted event
    // and knows to send the WebRTC offer to us
    socket.emit('accept_call', {
      callerSocketId: incomingCall.callerSocketId,
      callType: incomingCall.callType,
    });

    setActiveCall({
      callType: incomingCall.callType,
      remoteSocketId: null,
      remoteUserName: incomingCall.callerName,
      isIncoming: true,
      callerSocketId: incomingCall.callerSocketId,
    });
    setIncomingCall(null);
  };

  // â”€â”€ Reject incoming call â”€â”€
  const rejectCall = () => {
    if (incomingCall) {
      // BUG 5 FIX: Server expects 'callerSocketId' not 'targetSocketId'
      socket.emit('reject_call', { callerSocketId: incomingCall.callerSocketId });
    }
    setIncomingCall(null);
  };

  const getInitials = (name) => {
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getLastMessage = (userId) => {
    const userMsgs = messages.filter((m) => m.from === userId || m.to === userId);
    if (userMsgs.length === 0) return 'No messages yet';
    const last = userMsgs[userMsgs.length - 1];
    return last.file ? (last.file.type === 'sticker' ? 'Sent a sticker' : 'Sent a file') : last.text;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  // Parse booking modal details from notes if they are combined
  let modalDob = 'N/A';
  let modalTob = 'N/A';
  let modalPob = 'N/A';
  let modalQuestion = 'No specific question provided.';

  if (selectedBookingForModal) {
    modalDob = selectedBookingForModal.dob || 'N/A';
    modalTob = selectedBookingForModal.tob || 'N/A';
    modalPob = selectedBookingForModal.pob || 'N/A';
    modalQuestion = selectedBookingForModal.notes || 'No specific question provided.';

    if (modalDob === 'N/A' && selectedBookingForModal.notes && selectedBookingForModal.notes.includes('DOB:')) {
      const notesStr = selectedBookingForModal.notes;
      const dobMatch = notesStr.match(/DOB:\s*([^,]+)/);
      const tobMatch = notesStr.match(/TOB:\s*([^,]+)/);
      const pobMatch = notesStr.match(/POB:\s*([^.]+)/);
      const qMatch = notesStr.match(/Q:\s*(.*)/);

      if (dobMatch) modalDob = dobMatch[1].trim();
      if (tobMatch) modalTob = tobMatch[1].trim();
      if (pobMatch) modalPob = pobMatch[1].trim();
      if (qMatch) modalQuestion = qMatch[1].trim() || 'No specific question provided.';
    }
  }

  // â”€â”€ Render: Active Call Overlay â”€â”€
  if (activeCall) {
    return (
      <VideoCall
        socket={socket}
        callType={activeCall.callType}
        remoteSocketId={activeCall.remoteSocketId}
        remoteUserName={activeCall.remoteUserName}
        isIncoming={activeCall.isIncoming}
        callerSocketId={activeCall.callerSocketId}
        onEndCall={() => setActiveCall(null)}
      />
    );
  }

  if (!isJoined) {
    return (
      <div className="chat-container">
        <div className="join-chat-card glass-card">
          <h2>Admin Login</h2>
          <form onSubmit={handleLogin} className="join-form">
            <input
              type="password"
              placeholder="Admin Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="chat-input-field"
            />
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Login
            </button>
          </form>
        </div>

      </div>
    );
  }

  const activeMessages = messages.filter(
    (msg) => msg.from === activeClient?.userId || msg.to === activeClient?.userId
  );

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredBookings = bookingFilter === 'All' 
    ? allBookings 
    : allBookings.filter(b => b.status === bookingFilter.toLowerCase());

  return (
    <div className="admin-dashboard-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingTop: '80px', background: 'transparent' }}>
      
      {/* Incoming call notification */}
      {incomingCall && (
        <CallNotification
          callerName={incomingCall.callerName}
          callType={incomingCall.callType}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {/* Top Navigation Tab Bar */}
      <div className="admin-tab-bar" style={{ display: 'flex', gap: '20px', padding: '0 24px', background: 'transparent', borderBottom: '2px solid #1A1400' }}>
        <button onClick={() => { setActiveTab('chat'); setActiveClient(null); }} className="admin-tab" style={{ padding: '16px 8px', background: 'transparent', border: 'none', borderBottom: activeTab === 'chat' ? '3px solid #FF6B00' : '3px solid transparent', color: activeTab === 'chat' ? '#FF6B00' : '#1A1400', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', outline: 'none' }}>
          <Smile size={18} /> Live Chat
        </button>
        <button onClick={() => { setActiveTab('audio'); setActiveClient(null); }} className="admin-tab" style={{ padding: '16px 8px', background: 'transparent', border: 'none', borderBottom: activeTab === 'audio' ? '3px solid #FF6B00' : '3px solid transparent', color: activeTab === 'audio' ? '#FF6B00' : '#1A1400', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', outline: 'none' }}>
          <Phone size={18} /> Audio Calls
        </button>
        <button onClick={() => { setActiveTab('video'); setActiveClient(null); }} className="admin-tab" style={{ padding: '16px 8px', background: 'transparent', border: 'none', borderBottom: activeTab === 'video' ? '3px solid #FF6B00' : '3px solid transparent', color: activeTab === 'video' ? '#FF6B00' : '#1A1400', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', outline: 'none' }}>
          <Video size={18} /> Video Calls
        </button>
        <button onClick={() => { setActiveTab('users'); setActiveClient(null); }} className="admin-tab" style={{ padding: '16px 8px', background: 'transparent', border: 'none', borderBottom: activeTab === 'users' ? '3px solid #FF6B00' : '3px solid transparent', color: activeTab === 'users' ? '#FF6B00' : '#1A1400', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', outline: 'none' }}>
          <Users size={18} /> Users
        </button>
        <button onClick={() => setActiveTab('bookings')} className="admin-tab" style={{ padding: '16px 8px', background: 'transparent', border: 'none', borderBottom: activeTab === 'bookings' ? '3px solid #FF6B00' : '3px solid transparent', color: activeTab === 'bookings' ? '#FF6B00' : '#1A1400', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', outline: 'none' }}>
          <Calendar size={18} /> Bookings
        </button>
        <button onClick={() => setActiveTab('blogs')} className="admin-tab" style={{ padding: '16px 8px', background: 'transparent', border: 'none', borderBottom: activeTab === 'blogs' ? '3px solid #FF6B00' : '3px solid transparent', color: activeTab === 'blogs' ? '#FF6B00' : '#1A1400', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', outline: 'none' }}>
          <FileText size={18} /> Blogs
        </button>
        <button onClick={() => setActiveTab('stats')} className="admin-tab" style={{ padding: '16px 8px', background: 'transparent', border: 'none', borderBottom: activeTab === 'stats' ? '3px solid #FF6B00' : '3px solid transparent', color: activeTab === 'stats' ? '#FF6B00' : '#1A1400', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', outline: 'none' }}>
          <BarChart3 size={18} /> Stats
        </button>
      </div>

      <div className="admin-content-area" style={{ flex: 1, overflow: 'hidden' }}>
        
        {/* === SESSIONS TAB (Chat, Audio, Video) === */}
        {['chat', 'audio', 'video'].includes(activeTab) && (() => {
          const filteredClients = clients.filter(c => (c.consultationType || 'chat') === activeTab);
          return (
            <div className="admin-dashboard" style={{ height: '100%', margin: 0, padding: 0 }}>
            {/* Left Sidebar */}
            <div className="admin-sidebar">
              <div className="sidebar-header">
                <h3>Active Consultations</h3>
                <span className="live-count">{clients.length}</span>
              </div>

              <div className="client-list">
                {filteredClients.length === 0 ? (
                  <p className="no-clients">No active clients in this queue</p>
                ) : (
                  filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className={`admin-client-card ${activeClient?.userId === client.userId ? 'active' : ''}`}
                      onClick={() => setActiveClient(client)}
                    >
                      <div className="admin-avatar-wrapper">
                        <div className="admin-avatar">{getInitials(client.name)}</div>
                        <div className="online-dot-pulse" style={{ width: '10px', height: '10px', right: '-2px', bottom: '-2px' }}></div>
                      </div>
                      <div className="client-card-info">
                        <div className="client-card-header">
                          <h4>{client.name}</h4>
                        </div>
                        <p className="last-message">{getLastMessage(client.userId)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Chat Area */}
            <div className="admin-chat-area custom-chat-bg">
              {activeClient ? (
                <>
                  <div className="admin-chat-header">
                    <div className="header-info">
                      <div className="avatar-wrapper">
                        <div className="admin-avatar" style={{ width: '40px', height: '40px' }}>
                          {getInitials(activeClient.name)}
                        </div>
                        <div className="online-dot-pulse" style={{ width: '10px', height: '10px' }}></div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ color: '#1A1400', margin: 0, fontSize: '16px' }}>{activeClient.name}</h3>
                          <span style={{ color: '#10B981', fontSize: '12px' }}>Online</span>
                        </div>
                        <p className="subtitle">Consultation Session</p>
                      </div>
                    </div>

                    <div className="header-actions">
                      {activeTab === 'audio' && (
                        <button
                          className="action-pill"
                          title="Start Audio Call"
                          onClick={() => startCall('audio')}
                          style={{ background: '#F59E0B', color: '#1A1400', border: '1px solid #1A1400', fontWeight: 'bold' }}
                        >
                          <Phone size={16} /> Call Client
                        </button>
                      )}
                      {activeTab === 'video' && (
                        <button
                          className="action-pill"
                          title="Start Video Call"
                          onClick={() => startCall('video')}
                          style={{ background: '#F59E0B', color: '#1A1400', border: '1px solid #1A1400', fontWeight: 'bold' }}
                        >
                          <Video size={16} /> Call Client
                        </button>
                      )}
                      {activeTab === 'chat' && (
                        <span style={{ fontSize: '12px', color: '#666' }}>Chat strictly for text.</span>
                      )}
                      <button className="action-btn" style={{ border: 'none', marginLeft: '5px' }}>
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="chat-messages">
                    {activeMessages.length === 0 ? (
                      <div className="empty-chat">
                        <p>No messages yet.</p>
                      </div>
                    ) : (
                      activeMessages.map((msg, index) => {
                        const isMine = msg.from !== activeClient.userId;
                        return (
                          <div key={index} className={`message-wrapper slide-in ${isMine ? 'mine' : 'theirs'}`}>
                            {!isMine && (
                              <div className="msg-avatar">
                                <div className="admin-avatar" style={{ width: '24px', height: '24px', fontSize: '10px', borderWidth: '1px' }}>
                                  {getInitials(activeClient.name)}
                                </div>
                              </div>
                            )}

                            <div className="message-content">
                              <div className="message-bubble">
                                {msg.file && msg.file.type === 'sticker' && (
                                  <img src={msg.file.dataUrl} alt="Sticker" style={{ width: '100px', background: 'transparent', border: 'none' }} />
                                )}

                                {msg.file && msg.file.type !== 'sticker' && msg.file.type.startsWith('image/') && (
                                  <a href={msg.file.dataUrl} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                                    <img
                                      src={msg.file.dataUrl}
                                      alt="attachment"
                                      style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: msg.text ? '8px' : '0' }}
                                    />
                                  </a>
                                )}

                                {msg.file && msg.file.type !== 'sticker' && !msg.file.type.startsWith('image/') && (
                                  <div className="file-attachment-bubble" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <FileText size={24} />
                                      <div className="file-meta">
                                        <span className="file-name">{msg.file.name}</span>
                                        <span className="file-size">{formatSize(msg.file.size)}</span>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', width: '100%' }}>
                                      <a
                                        href={msg.file.dataUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                          fontSize: '12px', color: '#F59E0B', textDecoration: 'none',
                                          border: '1px solid rgba(245,158,11,0.4)', borderRadius: '12px',
                                          padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'center',
                                        }}
                                      >
                                        Open
                                      </a>
                                      <a
                                        href={msg.file.dataUrl}
                                        download={msg.file.name}
                                        style={{
                                          fontSize: '12px', color: '#1A1400', textDecoration: 'none',
                                          background: 'rgba(124,58,237,0.4)', borderRadius: '12px',
                                          padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'center',
                                        }}
                                      >
                                        Download
                                      </a>
                                    </div>
                                  </div>
                                )}

                                {msg.text && <p>{msg.text}</p>}
                              </div>

                              <div className="msg-meta">
                                <span className="timestamp">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMine && <CheckCheck size={14} className="seen-tick" />}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="admin-input-container">
                    {selectedFile && (
                      <div className="file-preview-chip">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {selectedFile.type.startsWith('image/') ? (
                            <img src={URL.createObjectURL(selectedFile)} alt="preview" className="file-thumb" />
                          ) : (
                            <FileText size={16} color="#F59E0B" />
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="preview-name">{selectedFile.name}</span>
                            <span className="preview-size">{formatSize(selectedFile.size)}</span>
                          </div>
                        </div>
                        <button onClick={() => setSelectedFile(null)} className="remove-file-btn">
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    <form onSubmit={handleSend} className="chat-input-area" style={{ borderTop: 'none', padding: '0 1.5rem 1rem' }}>
                      <div className="input-bar" style={{ borderRadius: '28px' }}>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept="image/*,.pdf,.doc,.docx"
                          hidden
                        />
                        <button type="button" className="icon-btn" onClick={() => fileInputRef.current.click()}>
                          <Paperclip size={20} />
                        </button>

                        <input
                          type="text"
                          placeholder={`Reply to ${activeClient.name}...`}
                          value={inputMsg}
                          onChange={(e) => setInputMsg(e.target.value)}
                          className="chat-input-field"
                          autoFocus
                        />

                        <div className="picker-container" ref={pickerRef}>
                          <button type="button" className="icon-btn" onClick={() => setShowPicker(!showPicker)}>
                            <Smile size={20} />
                          </button>

                          {showPicker && (
                            <div className="emoji-picker-panel">
                              <div className="picker-tabs">
                                <button type="button" className={pickerTab === 'emoji' ? 'active' : ''} onClick={() => setPickerTab('emoji')}>
                                  Emoji
                                </button>
                                <button type="button" className={pickerTab === 'sticker' ? 'active' : ''} onClick={() => setPickerTab('sticker')}>
                                  Stickers
                                </button>
                              </div>
                              <div className="picker-content">
                                {pickerTab === 'emoji' ? (
                                  <div className="emoji-grid">
                                    {EMOJIS.map((emoji, i) => (
                                      <span key={i} onClick={() => { setInputMsg((prev) => prev + emoji); setShowPicker(false); }}>
                                        {emoji}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="sticker-grid">
                                    {STICKERS.map((st, i) => (
                                      <img key={i} src={st} alt="sticker" onClick={() => sendSticker(st)} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <button type="submit" className="send-btn" disabled={!inputMsg.trim() && !selectedFile}>
                          <Send size={18} />
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <h2>Select a client to start chatting</h2>
                  <p>Active consultations will appear on the left.</p>
                </div>
              )}
            </div>
          </div>
          );
        })()}

        {/* === USERS TAB === */}
        {activeTab === 'users' && (
          <div className="admin-panel-content" style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: '#1A1400' }}>All Registered Users <span style={{ background: 'rgba(26, 20, 0, 0.1)', padding: '4px 12px', borderRadius: '12px', fontSize: '14px', marginLeft: '12px' }}>{allUsers.length}</span></h2>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#1A1400' }} />
                <input 
                  type="text" 
                  placeholder="Search name or email..." 
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ background: 'rgba(26, 20, 0, 0.1)', border: '1px solid rgba(26, 20, 0, 0.1)', borderRadius: '8px', padding: '8px 12px 8px 36px', color: '#1A1400', outline: 'none' }} 
                />
              </div>
            </div>

            {loading ? <div style={{ color: '#1A1400', textAlign: 'center', padding: '40px' }}>Loading users...</div> : filteredUsers.length === 0 ? <div style={{ color: '#1A1400', textAlign: 'center', padding: '40px' }}>No users found.</div> : (
              <div style={{ overflowX: 'auto', background: 'rgba(26, 20, 0, 0.1)', border: '1px solid rgba(26, 20, 0, 0.1)', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#1A1400', textAlign: 'left', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ background: '#FF6B00', borderBottom: '1px solid #1A1400' }}>
                      <th style={{ padding: '16px', color: '#1A1400' }}>#</th>
                      <th style={{ padding: '16px', color: '#1A1400' }}>Name</th>
                      <th style={{ padding: '16px', color: '#1A1400' }}>Email</th>
                      <th style={{ padding: '16px', color: '#1A1400' }}>Phone</th>
                      <th style={{ padding: '16px', color: '#1A1400' }}>Joined Date</th>
                      <th style={{ padding: '16px', color: '#1A1400' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, i) => (
                      <tr key={user._id} style={{ borderBottom: '1px solid #1A1400', transition: 'background 0.2s' }}>
                        <td style={{ padding: '16px', color: '#1A1400' }}>{i + 1}</td>
                        <td style={{ padding: '16px', fontWeight: 'bold' }}>{user.name}</td>
                        <td style={{ padding: '16px', color: '#1A1400' }}>{user.email}</td>
                        <td style={{ padding: '16px', color: '#1A1400' }}>{user.phone || 'Not provided'}</td>
                        <td style={{ padding: '16px', color: '#1A1400' }}>{formatDate(user.createdAt)}</td>
                        <td style={{ padding: '16px', display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
                          <button onClick={() => setSelectedUser(user)} style={{ background: '#FF6B00', color: '#1A1400', border: '2px solid #1A1400', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>View</button>
                          
                          <div style={{ position: 'relative' }}>
                            <button 
                              onClick={() => setActiveMenuDropdownId(activeMenuDropdownId === user._id ? null : user._id)} 
                              style={{ background: 'transparent', border: '2px solid #1A1400', color: '#1A1400', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {activeMenuDropdownId === user._id && (
                              <div style={{
                                position: 'absolute', right: 0, top: '100%', zIndex: 10,
                                background: '#FFF', border: '2px solid #1A1400',
                                borderRadius: '8px', padding: '8px', minWidth: '120px',
                                boxShadow: '4px 4px 0 #1A1400', marginTop: '4px'
                              }}>
                                <button 
                                  onClick={() => { setActiveMenuDropdownId(null); deleteUser(user._id); }} 
                                  style={{ background: 'transparent', color: '#1A1400', border: 'none', width: '100%', textAlign: 'left', padding: '8px 12px', cursor: 'pointer', fontSize: '13px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* === BOOKINGS TAB === */}
        {activeTab === 'bookings' && (
          <div className="admin-panel-content" style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <h2 style={{ margin: 0, color: '#1A1400' }}>All Bookings <span style={{ background: 'rgba(26, 20, 0, 0.1)', padding: '4px 12px', borderRadius: '12px', fontSize: '14px', marginLeft: '12px' }}>{filteredBookings.length}</span></h2>
              <div style={{ display: 'flex', gap: '8px', background: 'rgba(26, 20, 0, 0.1)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(26, 20, 0, 0.1)' }}>
                {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(filter => (
                  <button 
                    key={filter} 
                    onClick={() => setBookingFilter(filter)}
                    style={{ background: bookingFilter === filter ? '#1A1400' : 'transparent', color: bookingFilter === filter ? '#FFE999' : '#1A1400', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: bookingFilter === filter ? 'bold' : 'normal' }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {loading ? <div style={{ color: '#1A1400', textAlign: 'center', padding: '40px' }}>Loading bookings...</div> : filteredBookings.length === 0 ? <div style={{ color: '#1A1400', textAlign: 'center', padding: '40px' }}>No bookings found.</div> : (
              <div style={{ overflowX: 'auto', background: 'rgba(26, 20, 0, 0.1)', border: '1px solid rgba(26, 20, 0, 0.1)', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#1A1400', textAlign: 'left', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(26, 20, 0, 0.1)', borderBottom: '1px solid rgba(26, 20, 0, 0.1)' }}>
                      <th style={{ padding: '16px' }}>#</th>
                      <th style={{ padding: '16px' }}>Client Name</th>
                      <th style={{ padding: '16px' }}>Date</th>
                      <th style={{ padding: '16px' }}>Time Slot</th>
                      <th style={{ padding: '16px' }}>Type</th>
                      <th style={{ padding: '16px' }}>Status</th>
                      <th style={{ padding: '16px' }}>Amount</th>
                      <th style={{ padding: '16px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b, i) => (
                      <tr key={b._id} style={{ borderBottom: '1px solid rgba(26, 20, 0, 0.1)' }}>
                        <td style={{ padding: '16px', color: '#1A1400' }}>{i + 1}</td>
                        <td style={{ padding: '16px', fontWeight: 'bold' }}>{b.userName || 'Unknown'}</td>
                        <td style={{ padding: '16px', color: '#1A1400' }}>{b.date || 'N/A'}</td>
                        <td style={{ padding: '16px', color: '#1A1400' }}>{b.timeSlot || 'N/A'}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(26, 20, 0, 0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>
                            {b.consultationType === 'video' ? <Video size={12} /> : b.consultationType === 'audio' ? <Phone size={12} /> : <Smile size={12} />}
                            {b.consultationType?.toUpperCase() || 'CHAT'}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ 
                            padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                            background: b.status === 'pending' ? 'rgba(245,158,11,0.2)' : b.status === 'confirmed' ? 'rgba(16,185,129,0.2)' : b.status === 'completed' ? 'rgba(124,58,237,0.2)' : 'rgba(220,38,38,0.2)',
                            color: b.status === 'pending' ? '#F59E0B' : b.status === 'confirmed' ? '#10B981' : b.status === 'completed' ? '#A78BFA' : '#F87171'
                          }}>
                            {b.status?.toUpperCase() || 'PENDING'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#10B981', fontWeight: 'bold' }}>₹{b.amount || 0}</td>
                        <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                          {b.status === 'pending' && (
                            <>
                              <button onClick={() => updateBookingStatus(b._id, 'confirmed')} style={{ background: '#FF6B00', color: '#1A1400', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Confirm</button>
                              <button onClick={() => updateBookingStatus(b._id, 'cancelled')} style={{ background: 'transparent', border: '2px solid #1A1400', color: '#1A1400', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                            </>
                          )}
                          {b.status === 'confirmed' && (
                            <>
                              <button onClick={() => updateBookingStatus(b._id, 'completed')} style={{ background: '#FF6B00', color: '#1A1400', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Complete</button>
                              <button onClick={() => updateBookingStatus(b._id, 'cancelled')} style={{ background: 'transparent', border: '2px solid #1A1400', color: '#1A1400', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                              <button onClick={() => handleNotifyUser(b)} title="Notify User" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid #F59E0B', color: '#F59E0B', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Bell size={16} />
                              </button>
                            </>
                          )}
                          <button onClick={() => { setSelectedBookingForModal(b); setShowBookingModal(true); }} title="View Details" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid #3b82f6', color: '#3b82f6', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Eye size={16} />
                          </button>
                          {(b.status === 'completed' || b.status === 'cancelled') && (
                            <span style={{ color: '#1A1400' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* === STATS TAB === */}
        {activeTab === 'stats' && (
          <div className="admin-panel-content" style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
            <h2 style={{ margin: '0 0 24px 0', color: '#1A1400' }}>Dashboard Overview</h2>
            
            {loading || !stats ? <div style={{ color: '#1A1400', textAlign: 'center', padding: '40px' }}>Loading stats...</div> : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                  
                  <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(124,58,237,0.05))', border: '1px solid rgba(124,58,237,0.2)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#A78BFA' }}>
                      <Users size={24} /> <span style={{ fontWeight: 'bold' }}>Total Users</span>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1A1400' }}>{stats.totalUsers}</div>
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))', border: '1px solid rgba(245,158,11,0.2)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#FBBF24' }}>
                      <Calendar size={24} /> <span style={{ fontWeight: 'bold' }}>Total Bookings</span>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1A1400' }}>{stats.totalBookings}</div>
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.2)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#34D399' }}>
                      <CheckCircle size={24} /> <span style={{ fontWeight: 'bold' }}>Completed Sessions</span>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1A1400' }}>{stats.completedSessions}</div>
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))', border: '1px solid rgba(59,130,246,0.2)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#60A5FA' }}>
                      <BarChart3 size={24} /> <span style={{ fontWeight: 'bold' }}>Total Revenue</span>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1A1400' }}>₹{stats.totalRevenue}</div>
                  </div>

                </div>

                <h3 style={{ margin: '0 0 16px 0', color: '#1A1400' }}>Recent Bookings</h3>
                {stats.recentBookings.length === 0 ? <p style={{ color: '#1A1400' }}>No bookings yet.</p> : (
                  <div style={{ overflowX: 'auto', background: 'rgba(26, 20, 0, 0.1)', border: '1px solid rgba(26, 20, 0, 0.1)', borderRadius: '12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#1A1400', textAlign: 'left', minWidth: '600px' }}>
                      <thead>
                        <tr style={{ background: 'rgba(26, 20, 0, 0.1)', borderBottom: '1px solid rgba(26, 20, 0, 0.1)' }}>
                          <th style={{ padding: '16px' }}>Client</th>
                          <th style={{ padding: '16px' }}>Date & Time</th>
                          <th style={{ padding: '16px' }}>Type</th>
                          <th style={{ padding: '16px' }}>Amount</th>
                          <th style={{ padding: '16px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentBookings.map((b) => (
                          <tr key={b._id} style={{ borderBottom: '1px solid rgba(26, 20, 0, 0.1)' }}>
                            <td style={{ padding: '16px', fontWeight: 'bold' }}>{b.userName || 'Unknown'}</td>
                            <td style={{ padding: '16px', color: '#1A1400' }}>{b.date} • {b.timeSlot}</td>
                            <td style={{ padding: '16px', textTransform: 'capitalize' }}>{b.consultationType}</td>
                            <td style={{ padding: '16px', color: '#10B981' }}>₹{b.amount}</td>
                            <td style={{ padding: '16px' }}>
                              <span style={{ 
                                padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                                background: b.status === 'pending' ? 'rgba(245,158,11,0.2)' : b.status === 'confirmed' ? 'rgba(16,185,129,0.2)' : b.status === 'completed' ? 'rgba(124,58,237,0.2)' : 'rgba(220,38,38,0.2)',
                                color: b.status === 'pending' ? '#F59E0B' : b.status === 'confirmed' ? '#10B981' : b.status === 'completed' ? '#A78BFA' : '#F87171'
                              }}>
                                {b.status?.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* === BLOGS TAB === */}
        {activeTab === 'blogs' && (
          <div className="admin-panel-content" style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
            <h2 style={{ margin: '0 0 24px 0', color: '#1A1400' }}>Manage Blogs</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
              <div style={{ background: 'rgba(26, 20, 0, 0.05)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(26, 20, 0, 0.1)', height: 'fit-content' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1A1400' }}>Add New Blog</h3>
                <form onSubmit={handleCreateBlog} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ color: '#1A1400', fontSize: '14px', fontWeight: 'bold' }}>Blog Title:</label>
                    <input type="text" placeholder="Enter title" value={newBlog.title} onChange={(e) => setNewBlog({...newBlog, title: e.target.value})} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ color: '#1A1400', fontSize: '14px', fontWeight: 'bold' }}>Blog Description:</label>
                    <textarea placeholder="Enter short description" value={newBlog.excerpt} onChange={(e) => setNewBlog({...newBlog, excerpt: e.target.value})} required rows="4" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none', resize: 'vertical' }}></textarea>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ color: '#1A1400', fontSize: '14px', fontWeight: 'bold' }}>Date of Writing:</label>
                    <input type="date" value={newBlog.date} onChange={(e) => setNewBlog({...newBlog, date: e.target.value})} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ color: '#1A1400', fontSize: '14px', fontWeight: 'bold' }}>Blog Written By:</label>
                    <input type="text" placeholder="e.g. Astro Dilip Sharma" value={newBlog.author} onChange={(e) => setNewBlog({...newBlog, author: e.target.value})} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ color: '#1A1400', fontSize: '14px', fontWeight: 'bold' }}>Upload Blog Image:</label>
                    <input 
                      id="blog-image-upload"
                      type="file" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            let result = reader.result;
                            if (!result.startsWith('data:image/')) {
                                const base64Data = result.split('base64,')[1];
                                result = `data:image/jpeg;base64,${base64Data}`;
                            }
                            setNewBlog({...newBlog, image: result});
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                      style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }} 
                    />
                    {newBlog.image && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                        <img src={newBlog.image} alt="preview" style={{ height: '60px', objectFit: 'contain', borderRadius: '8px' }} />
                        <button 
                          type="button" 
                          onClick={() => {
                            setNewBlog({...newBlog, image: ''});
                            const fileInput = document.getElementById('blog-image-upload');
                            if (fileInput) fileInput.value = '';
                          }}
                          style={{ background: 'rgba(220,38,38,0.1)', color: '#DC2626', border: '1px solid #DC2626', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>

                  <button type="submit" style={{ background: '#FF6B00', color: '#1A1400', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Publish Blog</button>
                </form>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* Requested Blogs Section */}
                <div>
                  <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1A1400', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#F59E0B', color: '#FFF', padding: '2px 8px', borderRadius: '12px', fontSize: '14px' }}>New</span>
                    Requested Experiences
                  </h3>
                  {loading ? <p>Loading...</p> : allBlogs.filter(b => b.status === 'pending').length === 0 ? <p style={{ color: '#666', fontStyle: 'italic' }}>No pending requests.</p> : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                      {allBlogs.filter(b => b.status === 'pending').map(blog => (
                        <div key={blog._id} style={{ background: '#FFF', padding: '16px', borderRadius: '12px', border: '2px solid #F59E0B', display: 'flex', gap: '16px', alignItems: 'center', position: 'relative' }}>
                          {blog.image && <img src={blog.image} alt="blog" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />}
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#1A1400' }}>{blog.title}</h4>
                            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>{blog.date} • By {blog.author}</p>
                            <p style={{ margin: 0, fontSize: '13px', color: '#333' }}>{blog.excerpt}</p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button onClick={() => handlePublishBlog(blog._id)} style={{ background: '#10B981', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Approve & Publish</button>
                            <button onClick={() => handleDeleteBlog(blog._id)} style={{ background: 'rgba(220,38,38,0.1)', color: '#DC2626', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Published Blogs Section */}
                <div>
                  <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1A1400' }}>Published Blogs</h3>
                  {loading ? <p>Loading blogs...</p> : allBlogs.filter(b => b.status === 'published').length === 0 ? <p>No blogs published yet.</p> : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                      {allBlogs.filter(b => b.status === 'published').map(blog => (
                        <div key={blog._id} style={{ background: '#FFF', padding: '16px', borderRadius: '12px', border: '1px solid rgba(26, 20, 0, 0.1)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <img src={blog.image} alt="blog" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#1A1400' }}>{blog.title}</h4>
                            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>{blog.date} • By {blog.author}</p>
                            <p style={{ margin: 0, fontSize: '13px', color: '#333' }}>{blog.excerpt.substring(0, 80)}...</p>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setEditBlogData(blog)} style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Edit</button>
                            <button onClick={() => handleDeleteBlog(blog._id)} style={{ background: 'rgba(220,38,38,0.1)', color: '#DC2626', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'transparent', border: '1px solid rgba(124,58,237,0.4)', borderRadius: '16px', width: '90%', maxWidth: '400px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setSelectedUser(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#1A1400', cursor: 'pointer' }}><X size={20} /></button>
            <h2 style={{ margin: '0 0 20px 0', color: '#1A1400', borderBottom: '1px solid rgba(26, 20, 0, 0.1)', paddingBottom: '12px' }}>User Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#1A1400' }}>
              <div><strong style={{ color: '#F59E0B' }}>Name:</strong> {selectedUser.name}</div>
              <div><strong style={{ color: '#F59E0B' }}>Email:</strong> {selectedUser.email}</div>
              <div><strong style={{ color: '#F59E0B' }}>Phone:</strong> {selectedUser.phone || 'N/A'}</div>
              <div><strong style={{ color: '#F59E0B' }}>Date of Birth:</strong> {selectedUser.birthDate || 'N/A'}</div>
              <div><strong style={{ color: '#F59E0B' }}>Time of Birth:</strong> {selectedUser.birthTime || 'N/A'}</div>
              <div><strong style={{ color: '#F59E0B' }}>Place of Birth:</strong> {selectedUser.birthPlace || 'N/A'}</div>
              <div><strong style={{ color: '#F59E0B' }}>Messages Sent:</strong> {messages.filter(m => m.from === selectedUser._id).length}</div>
              <div><strong style={{ color: '#F59E0B' }}>Account Created:</strong> {formatDate(selectedUser.createdAt)}</div>
            </div>
            <button onClick={() => setSelectedUser(null)} style={{ marginTop: '24px', width: '100%', background: 'rgba(26, 20, 0, 0.1)', color: '#1A1400', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
          </div>
        </div>
      )}

      {/* === BOOKING DETAILS MODAL === */}
      {showBookingModal && selectedBookingForModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'transparent', border: '1px solid rgba(26, 20, 0, 0.1)',
            borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '560px',
            color: '#1A1400', maxHeight: '90vh', overflowY: 'auto', position: 'relative'
          }}>
            <button onClick={() => setShowBookingModal(false)} style={{
              position: 'absolute', top: '24px', right: '24px', background: 'transparent',
              border: 'none', color: '#1A1400', cursor: 'pointer'
            }}>
              <X size={24} />
            </button>
            <h2 style={{ marginTop: 0, marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(26, 20, 0, 0.1)' }}>Booking Details</h2>
            
            {/* Section 1 */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#F59E0B', marginBottom: '12px' }}>Appointment Info</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
                <div><span style={{ color: '#1A1400' }}>ID:</span> {selectedBookingForModal._id}</div>
                <div><span style={{ color: '#1A1400' }}>Date:</span> {selectedBookingForModal.date}</div>
                <div><span style={{ color: '#1A1400' }}>Time:</span> {selectedBookingForModal.timeSlot}</div>
                <div><span style={{ color: '#1A1400' }}>Type:</span> {selectedBookingForModal.consultationType}</div>
                <div><span style={{ color: '#1A1400' }}>Status:</span> {selectedBookingForModal.status}</div>
                <div><span style={{ color: '#1A1400' }}>Amount:</span> ₹{selectedBookingForModal.amount}</div>
              </div>
            </div>

            {/* Section 2 */}
            <div style={{ marginBottom: '24px', paddingTop: '16px', borderTop: '1px solid rgba(26, 20, 0, 0.1)' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#F59E0B', marginBottom: '12px' }}>Client Info</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
                <div><span style={{ color: '#1A1400' }}>Name:</span> {selectedBookingForModal.userName || 'N/A'}</div>
                <div><span style={{ color: '#1A1400' }}>Phone:</span> {selectedBookingForModal.userPhone || 'N/A'}</div>
                <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#1A1400' }}>Email:</span> {selectedBookingForModal.userEmail || 'N/A'}</div>
              </div>
            </div>

            {/* Section 3 */}
            <div style={{ marginBottom: '24px', paddingTop: '16px', borderTop: '1px solid rgba(26, 20, 0, 0.1)' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#F59E0B', marginBottom: '12px' }}>Astrological Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
                <div><span style={{ color: '#1A1400' }}>DOB:</span> {modalDob}</div>
                <div><span style={{ color: '#1A1400' }}>TOB:</span> {modalTob}</div>
                <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#1A1400' }}>Place:</span> {modalPob}</div>
              </div>
            </div>

            {/* Section 4 */}
            <div style={{ marginBottom: '24px', paddingTop: '16px', borderTop: '1px solid rgba(26, 20, 0, 0.1)' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#F59E0B', marginBottom: '12px' }}>Client's Question / Topic</h3>
              <div style={{ background: 'rgba(26, 20, 0, 0.1)', padding: '16px', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {modalQuestion}
              </div>
            </div>

            {selectedBookingForModal.status === 'confirmed' && (
              <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(26, 20, 0, 0.1)', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => { handleNotifyUser(selectedBookingForModal); setShowBookingModal(false); }}
                  style={{ background: '#F59E0B', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Bell size={18} /> Start Session (Notify Client)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

      {/* Edit Blog Modal */}
      {editBlogData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#FFF', padding: '32px', borderRadius: '16px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: '#1A1400' }}>Edit Blog</h2>
              <button onClick={() => setEditBlogData(null)} style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}>&times;</button>
            </div>
            
            <form onSubmit={handleUpdateBlog} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#1A1400', fontSize: '14px', fontWeight: 'bold' }}>Blog Title:</label>
                <input type="text" value={editBlogData.title} onChange={(e) => setEditBlogData({...editBlogData, title: e.target.value})} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#1A1400', fontSize: '14px', fontWeight: 'bold' }}>Blog Description:</label>
                <textarea value={editBlogData.excerpt} onChange={(e) => setEditBlogData({...editBlogData, excerpt: e.target.value})} required rows="4" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none', resize: 'vertical' }}></textarea>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#1A1400', fontSize: '14px', fontWeight: 'bold' }}>Date of Writing:</label>
                <input type="text" value={editBlogData.date} onChange={(e) => setEditBlogData({...editBlogData, date: e.target.value})} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#1A1400', fontSize: '14px', fontWeight: 'bold' }}>Blog Written By:</label>
                <input type="text" value={editBlogData.author} onChange={(e) => setEditBlogData({...editBlogData, author: e.target.value})} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#1A1400', fontSize: '14px', fontWeight: 'bold' }}>Update Blog Image (Optional):</label>
                <input 
                  type="file" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        let result = reader.result;
                        if (!result.startsWith('data:image/')) {
                            const base64Data = result.split('base64,')[1];
                            result = `data:image/jpeg;base64,${base64Data}`;
                        }
                        setEditBlogData({...editBlogData, image: result});
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                  style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }} 
                />
                {editBlogData.image && (
                  <img src={editBlogData.image} alt="preview" style={{ height: '60px', objectFit: 'contain', alignSelf: 'flex-start', borderRadius: '8px', marginTop: '8px' }} />
                )}
              </div>

              <button type="submit" style={{ background: '#3B82F6', color: '#FFF', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '16px' }}>Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;






