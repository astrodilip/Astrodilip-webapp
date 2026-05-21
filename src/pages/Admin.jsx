import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, User, Phone, Video, MoreVertical, Paperclip, Smile, X, FileText, CheckCheck } from 'lucide-react';
import VideoCall from '../components/VideoCall';
import CallNotification from '../components/CallNotification';
import './Chat.css';

const socket = io('http://localhost:5000');

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

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pickerRef = useRef(null);

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
  }, [messages, activeClient]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      });
      if (response.ok) {
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

  return (
    <div className="admin-dashboard">
      {/* Incoming call notification */}
      {incomingCall && (
        <CallNotification
          callerName={incomingCall.callerName}
          callType={incomingCall.callType}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

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
  );
};

export default Admin;
