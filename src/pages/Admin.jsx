import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, User, Phone, Video, MoreVertical, Paperclip, Smile, X, FileText, CheckCheck, Users, Calendar, BarChart3, Search, Trash2, CheckCircle, XCircle } from 'lucide-react';
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

const EMOJIS = ['😊', '😂', '🥺', '🙏', '❤️', '👍', '✨', '🔥', '🙌', '💯', '🔮', '🕉️'];

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

  // ── Call States ──
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  // ── New Admin Panel States ──
  const [activeTab, setActiveTab] = useState('chat');
  const [allUsers, setAllUsers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // User Tab States
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Booking Tab States
  const [bookingFilter, setBookingFilter] = useState('All');

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pickerRef = useRef(null);

  // ── Auto-Login on Refresh ──
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

    // ── Call Signal Listeners ──

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

  // ── Fetch data when tabs change ──
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'bookings') fetchBookings();
    if (activeTab === 'stats') fetchStats();
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

  // ── Initiate a call to the active client ──
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

  // ── Accept incoming call ──
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

  // ── Reject incoming call ──
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

  // ── Render: Active Call Overlay ──
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
    <div className="admin-dashboard-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingTop: '80px', background: '#0a0a1a' }}>
      
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
      <div className="admin-tab-bar" style={{ display: 'flex', gap: '20px', padding: '0 24px', background: '#0a0a1a', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={() => setActiveTab('chat')} className="admin-tab" style={{ padding: '16px 8px', background: 'transparent', border: 'none', borderBottom: activeTab === 'chat' ? '2px solid #F59E0B' : '2px solid transparent', color: activeTab === 'chat' ? '#F59E0B' : 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', outline: 'none' }}>
          <Smile size={18} /> Live Chat
        </button>
        <button onClick={() => setActiveTab('users')} className="admin-tab" style={{ padding: '16px 8px', background: 'transparent', border: 'none', borderBottom: activeTab === 'users' ? '2px solid #F59E0B' : '2px solid transparent', color: activeTab === 'users' ? '#F59E0B' : 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', outline: 'none' }}>
          <Users size={18} /> Users
        </button>
        <button onClick={() => setActiveTab('bookings')} className="admin-tab" style={{ padding: '16px 8px', background: 'transparent', border: 'none', borderBottom: activeTab === 'bookings' ? '2px solid #F59E0B' : '2px solid transparent', color: activeTab === 'bookings' ? '#F59E0B' : 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', outline: 'none' }}>
          <Calendar size={18} /> Bookings
        </button>
        <button onClick={() => setActiveTab('stats')} className="admin-tab" style={{ padding: '16px 8px', background: 'transparent', border: 'none', borderBottom: activeTab === 'stats' ? '2px solid #F59E0B' : '2px solid transparent', color: activeTab === 'stats' ? '#F59E0B' : 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', outline: 'none' }}>
          <BarChart3 size={18} /> Stats
        </button>
      </div>

      <div className="admin-content-area" style={{ flex: 1, overflow: 'hidden' }}>
        
        {/* === CHAT TAB (Existing UI) === */}
        {activeTab === 'chat' && (
          <div className="admin-dashboard" style={{ height: '100%', margin: 0, padding: 0 }}>
            {/* Left Sidebar */}
            <div className="admin-sidebar">
              <div className="sidebar-header">
                <h3>Active Consultations</h3>
                <span className="live-count">{clients.length}</span>
              </div>

              <div className="client-list">
                {clients.length === 0 ? (
                  <p className="no-clients">No active clients</p>
                ) : (
                  clients.map((client) => (
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
                          <h3 style={{ color: '#fff', margin: 0, fontSize: '16px' }}>{activeClient.name}</h3>
                          <span style={{ color: '#10B981', fontSize: '12px' }}>Online</span>
                        </div>
                        <p className="subtitle">Consultation Session</p>
                      </div>
                    </div>

                    <div className="header-actions">
                      <button
                        className="action-pill"
                        title="Voice Call"
                        onClick={() => startCall('audio')}
                      >
                        <Phone size={16} /> Call
                      </button>
                      <button
                        className="action-btn"
                        title="Video Call"
                        onClick={() => startCall('video')}
                        style={{ border: 'none', marginLeft: '5px' }}
                      >
                        <Video size={18} />
                      </button>
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
                                          fontSize: '12px', color: '#fff', textDecoration: 'none',
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
        )}

        {/* === USERS TAB === */}
        {activeTab === 'users' && (
          <div className="admin-panel-content" style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: '#fff' }}>All Registered Users <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px', fontSize: '14px', marginLeft: '12px' }}>{allUsers.length}</span></h2>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'rgba(255,255,255,0.5)' }} />
                <input 
                  type="text" 
                  placeholder="Search name or email..." 
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px 8px 36px', color: '#fff', outline: 'none' }} 
                />
              </div>
            </div>

            {loading ? <div style={{ color: '#fff', textAlign: 'center', padding: '40px' }}>Loading users...</div> : filteredUsers.length === 0 ? <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '40px' }}>No users found.</div> : (
              <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', textAlign: 'left', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '16px' }}>#</th>
                      <th style={{ padding: '16px' }}>Name</th>
                      <th style={{ padding: '16px' }}>Email</th>
                      <th style={{ padding: '16px' }}>Phone</th>
                      <th style={{ padding: '16px' }}>Joined Date</th>
                      <th style={{ padding: '16px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, i) => (
                      <tr key={user._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '16px', color: 'rgba(255,255,255,0.5)' }}>{i + 1}</td>
                        <td style={{ padding: '16px', fontWeight: 'bold' }}>{user.name}</td>
                        <td style={{ padding: '16px', color: 'rgba(255,255,255,0.7)' }}>{user.email}</td>
                        <td style={{ padding: '16px', color: 'rgba(255,255,255,0.7)' }}>{user.phone || 'Not provided'}</td>
                        <td style={{ padding: '16px', color: 'rgba(255,255,255,0.7)' }}>{formatDate(user.createdAt)}</td>
                        <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                          <button onClick={() => setSelectedUser(user)} style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>View</button>
                          <button onClick={() => deleteUser(user._id)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Delete</button>
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
              <h2 style={{ margin: 0, color: '#fff' }}>All Bookings <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px', fontSize: '14px', marginLeft: '12px' }}>{filteredBookings.length}</span></h2>
              <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(filter => (
                  <button 
                    key={filter} 
                    onClick={() => setBookingFilter(filter)}
                    style={{ background: bookingFilter === filter ? 'rgba(255,255,255,0.1)' : 'transparent', color: bookingFilter === filter ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: bookingFilter === filter ? 'bold' : 'normal' }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {loading ? <div style={{ color: '#fff', textAlign: 'center', padding: '40px' }}>Loading bookings...</div> : filteredBookings.length === 0 ? <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '40px' }}>No bookings found.</div> : (
              <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', textAlign: 'left', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
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
                      <tr key={b._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '16px', color: 'rgba(255,255,255,0.5)' }}>{i + 1}</td>
                        <td style={{ padding: '16px', fontWeight: 'bold' }}>{b.userName || 'Unknown'}</td>
                        <td style={{ padding: '16px', color: 'rgba(255,255,255,0.7)' }}>{b.date || 'N/A'}</td>
                        <td style={{ padding: '16px', color: 'rgba(255,255,255,0.7)' }}>{b.timeSlot || 'N/A'}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>
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
                              <button onClick={() => updateBookingStatus(b._id, 'confirmed')} style={{ background: '#10B981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Confirm</button>
                              <button onClick={() => updateBookingStatus(b._id, 'cancelled')} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                            </>
                          )}
                          {b.status === 'confirmed' && (
                            <>
                              <button onClick={() => updateBookingStatus(b._id, 'completed')} style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Complete</button>
                              <button onClick={() => updateBookingStatus(b._id, 'cancelled')} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                            </>
                          )}
                          {(b.status === 'completed' || b.status === 'cancelled') && (
                            <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
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
            <h2 style={{ margin: '0 0 24px 0', color: '#fff' }}>Dashboard Overview</h2>
            
            {loading || !stats ? <div style={{ color: '#fff', textAlign: 'center', padding: '40px' }}>Loading stats...</div> : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                  
                  <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(124,58,237,0.05))', border: '1px solid rgba(124,58,237,0.2)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#A78BFA' }}>
                      <Users size={24} /> <span style={{ fontWeight: 'bold' }}>Total Users</span>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#fff' }}>{stats.totalUsers}</div>
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))', border: '1px solid rgba(245,158,11,0.2)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#FBBF24' }}>
                      <Calendar size={24} /> <span style={{ fontWeight: 'bold' }}>Total Bookings</span>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#fff' }}>{stats.totalBookings}</div>
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.2)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#34D399' }}>
                      <CheckCircle size={24} /> <span style={{ fontWeight: 'bold' }}>Completed Sessions</span>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#fff' }}>{stats.completedSessions}</div>
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))', border: '1px solid rgba(59,130,246,0.2)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#60A5FA' }}>
                      <BarChart3 size={24} /> <span style={{ fontWeight: 'bold' }}>Total Revenue</span>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#fff' }}>₹{stats.totalRevenue}</div>
                  </div>

                </div>

                <h3 style={{ margin: '0 0 16px 0', color: '#fff' }}>Recent Bookings</h3>
                {stats.recentBookings.length === 0 ? <p style={{ color: 'rgba(255,255,255,0.5)' }}>No bookings yet.</p> : (
                  <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', textAlign: 'left', minWidth: '600px' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <th style={{ padding: '16px' }}>Client</th>
                          <th style={{ padding: '16px' }}>Date & Time</th>
                          <th style={{ padding: '16px' }}>Type</th>
                          <th style={{ padding: '16px' }}>Amount</th>
                          <th style={{ padding: '16px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentBookings.map((b) => (
                          <tr key={b._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '16px', fontWeight: 'bold' }}>{b.userName || 'Unknown'}</td>
                            <td style={{ padding: '16px', color: 'rgba(255,255,255,0.7)' }}>{b.date} • {b.timeSlot}</td>
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

      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#0a0a1a', border: '1px solid rgba(124,58,237,0.4)', borderRadius: '16px', width: '90%', maxWidth: '400px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setSelectedUser(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
            <h2 style={{ margin: '0 0 20px 0', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>User Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: 'rgba(255,255,255,0.8)' }}>
              <div><strong style={{ color: '#F59E0B' }}>Name:</strong> {selectedUser.name}</div>
              <div><strong style={{ color: '#F59E0B' }}>Email:</strong> {selectedUser.email}</div>
              <div><strong style={{ color: '#F59E0B' }}>Phone:</strong> {selectedUser.phone || 'N/A'}</div>
              <div><strong style={{ color: '#F59E0B' }}>Date of Birth:</strong> {selectedUser.birthDate || 'N/A'}</div>
              <div><strong style={{ color: '#F59E0B' }}>Time of Birth:</strong> {selectedUser.birthTime || 'N/A'}</div>
              <div><strong style={{ color: '#F59E0B' }}>Place of Birth:</strong> {selectedUser.birthPlace || 'N/A'}</div>
              <div><strong style={{ color: '#F59E0B' }}>Messages Sent:</strong> {messages.filter(m => m.from === selectedUser._id).length}</div>
              <div><strong style={{ color: '#F59E0B' }}>Account Created:</strong> {formatDate(selectedUser.createdAt)}</div>
            </div>
            <button onClick={() => setSelectedUser(null)} style={{ marginTop: '24px', width: '100%', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Admin;
