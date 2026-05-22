import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, ArrowLeft, User, Phone, Video, Paperclip, Smile, CheckCheck, X, FileText, CalendarX } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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

const Chat = () => {
  const navigate = useNavigate();
  const [messages,    setMessages]    = useState([]);
  const [inputMsg,    setInputMsg]    = useState('');
  const [user,        setUser]        = useState(null);
  const [isJoined,    setIsJoined]    = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPicker,  setShowPicker]  = useState(false);
  const [pickerTab,   setPickerTab]   = useState('emoji');
  const [activeCall,  setActiveCall]  = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [hasBooking, setHasBooking] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(true);

  const adminSocketIdRef = useRef(null);
  const messagesEndRef   = useRef(null);
  const fileInputRef     = useRef(null);
  const pickerRef        = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('astrology_user');
    if (!saved) { navigate('/login'); return; }
    const parsedUser = JSON.parse(saved);
    setUser(parsedUser);

    fetch(`https://astrodilip-webapp.onrender.com/api/bookings/${parsedUser.id || parsedUser._id}`)
      .then(res => res.json())
      .then(data => {
        const hasConfirmed = data.some(b => b.status === 'confirmed');
        setHasBooking(hasConfirmed);
        setLoadingBooking(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingBooking(false);
      });

    socket.on('client_init', (data) => setMessages(data.messages));
    socket.on('receive_message', (msg) => setMessages(prev => [...prev, msg]));

    socket.on('admin_socket_id', ({ socketId }) => {
      console.log('Got admin socket ID:', socketId);
      adminSocketIdRef.current = socketId;
    });

    socket.on('incoming_call', ({ callerSocketId, callerName, callType }) => {
      setIncomingCall({ callerSocketId, callerName, callType });
    });

    // ─────────────────────────────────────────────────────────
    // KEY FIX: catch call_accepted HERE in Chat.jsx (always mounted)
    // NOT inside VideoCall (which may not be mounted yet when this fires).
    // We update activeCall with the real accepterSocketId so VideoCall
    // receives it as a prop and can send the WebRTC offer immediately.
    // ─────────────────────────────────────────────────────────
    socket.on('call_accepted', ({ accepterSocketId, accepterName, callType }) => {
      console.log('call_accepted — accepterSocketId:', accepterSocketId);
      setActiveCall(prev => {
        if (!prev) return null;
        return {
          ...prev,
          remoteSocketId: accepterSocketId,  // now we have the real socket ID
          remoteUserName: accepterName || prev.remoteUserName,
        };
      });
    });

    socket.on('call_rejected', () => {
      setActiveCall(null);
      setIncomingCall(null);
      alert('Call was declined.');
    });

    socket.on('call_ended', () => setActiveCall(null));

    return () => {
      socket.off('client_init');
      socket.off('receive_message');
      socket.off('admin_socket_id');
      socket.off('incoming_call');
      socket.off('call_accepted');
      socket.off('call_rejected');
      socket.off('call_ended');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!user) return;
    localStorage.setItem('astrology_user_id', user.id);
    socket.emit('join', { role: 'client', name: user.name, userId: user.id });
    setIsJoined(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
    e.target.value = '';
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputMsg.trim() && !selectedFile) return;

    let fileData = null;
    if (selectedFile) {
      fileData = { name: selectedFile.name, size: selectedFile.size, type: selectedFile.type };
      const buffer = await selectedFile.arrayBuffer();
      const base64 = btoa(new Uint8Array(buffer).reduce((d, b) => d + String.fromCharCode(b), ''));
      fileData.dataUrl = `data:${selectedFile.type};base64,${base64}`;
    }

    socket.emit('send_message', { text: inputMsg, to: 'admin', file: fileData });
    setInputMsg('');
    setSelectedFile(null);
  };

  const sendSticker = (url) => {
    socket.emit('send_message', { text: '', to: 'admin', file: { type: 'sticker', dataUrl: url, name: 'Sticker' } });
    setShowPicker(false);
  };

  // ── Start outgoing call ──
  const startCall = (callType) => {
    const adminId = adminSocketIdRef.current;
    if (!adminId) { alert('Admin is not online right now.'); return; }

    socket.emit('call_user', {
      targetSocketId: adminId,
      callerName: user?.name || 'Client',
      callType,
    });

    // Set activeCall with remoteSocketId = null for now.
    // It will be updated to the real accepterSocketId when call_accepted fires above.
    setActiveCall({
      callType,
      remoteSocketId: null,      // will be filled by call_accepted handler above
      remoteUserName: 'Astro Dilip Sharma',
      isIncoming: false,
      callerSocketId: null,
    });
  };

  // ── Accept incoming call ──
  const acceptCall = () => {
    if (!incomingCall) return;
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

  const rejectCall = () => {
    if (incomingCall) socket.emit('reject_call', { callerSocketId: incomingCall.callerSocketId });
    setIncomingCall(null);
  };

  const formatSize = (b) => b < 1024 ? b + ' B' : b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(1)+' MB';

  // ── Render active call ──
  // Only render VideoCall once remoteSocketId is known (for caller)
  // or immediately for callee (they just need callerSocketId)
  if (activeCall && (activeCall.isIncoming || activeCall.remoteSocketId)) {
    return (
      <>
        <VideoCall
          socket={socket}
          callType={activeCall.callType}
          remoteSocketId={activeCall.remoteSocketId}
          remoteUserName={activeCall.remoteUserName}
          isIncoming={activeCall.isIncoming}
          callerSocketId={activeCall.callerSocketId}
          onEndCall={() => setActiveCall(null)}
        />
        {incomingCall && (
          <CallNotification
            callerName={incomingCall.callerName}
            callType={incomingCall.callType}
            onAccept={acceptCall}
            onReject={rejectCall}
          />
        )}
      </>
    );
  }

  // Caller waiting for admin to accept
  if (activeCall && !activeCall.isIncoming && !activeCall.remoteSocketId) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24,
      }}>
        <div style={{
          width: 90, height: 90, borderRadius: '50%',
          background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, color: '#fff',
          boxShadow: '0 0 0 16px rgba(124,58,237,0.15),0 0 0 32px rgba(124,58,237,0.07)',
        }}>
          {activeCall.callType === 'video' ? '📹' : '🎙️'}
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 6px' }}>
            {activeCall.callType === 'video' ? 'Video calling' : 'Calling'}
          </p>
          <h2 style={{ color: '#fff', margin: 0 }}>{activeCall.remoteUserName}</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6 }}>Waiting for answer…</p>
        </div>
        <button
          onClick={() => { socket.emit('end_call', { targetSocketId: adminSocketIdRef.current }); setActiveCall(null); }}
          style={{
            background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
            border: 'none', borderRadius: '50%',
            width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer', fontSize: 24,
          }}
        >
          📵
        </button>
      </div>
    );
  }

  if (loadingBooking) {
    return <div className="chat-container"><div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}><p style={{ color: '#fff' }}>Loading...</p></div></div>;
  }

  if (!hasBooking) {
    return (
      <div className="chat-container">
        <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: '500px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: '#F59E0B' }}>
            <CalendarX size={64} />
          </div>
          <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Appointment Required</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>
            Please book a consultation session before chatting with Astro Dilip Sharma.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link to="/booking" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
              Book a Consultation
            </Link>
            <Link to="/my-bookings" className="btn-outline" style={{ display: 'flex', justifyContent: 'center', padding: '1rem', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none', borderRadius: '8px' }}>
              View My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="chat-container">
        <div className="join-chat-card glass-card" style={{ padding: '3rem 2rem' }}>
          <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Ready for Consultation?</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Click below to connect with Astro Dilip Sharma in real-time.
          </p>
          <form onSubmit={handleJoin} className="join-form">
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1.1rem' }}>
              Start Chat Session
            </button>
          </form>
          <button onClick={() => navigate('/consultation')} className="btn-outline" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page-wrapper custom-chat-bg">
      {incomingCall && (
        <CallNotification callerName={incomingCall.callerName} callType={incomingCall.callType} onAccept={acceptCall} onReject={rejectCall} />
      )}

      <div className="chat-interface custom-chat-panel">
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/consultation" className="back-btn"><ArrowLeft size={20} /></Link>
            <div className="header-info">
              <div className="avatar-wrapper">
                <div className="avatar"><User size={24} /></div>
                <div className="online-dot-pulse"></div>
              </div>
              <div>
                <h3>Astro Dilip Sharma</h3>
                <p className="subtitle">Vedic Astrologer · Typically replies instantly</p>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button className="action-btn" title="Voice Call" onClick={() => startCall('audio')}><Phone size={18} /></button>
            <button className="action-btn" title="Video Call" onClick={() => startCall('video')}><Video size={18} /></button>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-chat"><p>Send a message to start your consultation.</p></div>
          ) : (
            messages.map((msg, i) => {
              const isMine = msg.from === localStorage.getItem('astrology_user_id');
              return (
                <div key={i} className={`message-wrapper slide-in ${isMine ? 'mine' : 'theirs'}`}>
                  {!isMine && <div className="msg-avatar"><User size={16} /></div>}
                  <div className="message-content">
                    <div className="message-bubble">
                      {msg.file?.type === 'sticker' && <img src={msg.file.dataUrl} alt="Sticker" style={{ width: 100 }} />}
                      {msg.file && msg.file.type !== 'sticker' && msg.file.type.startsWith('image/') && (
                        <a href={msg.file.dataUrl} target="_blank" rel="noreferrer">
                          <img src={msg.file.dataUrl} alt="attachment" style={{ maxWidth: '100%', borderRadius: 8 }} />
                        </a>
                      )}
                      {msg.file && msg.file.type !== 'sticker' && !msg.file.type.startsWith('image/') && (
                        <div className="file-attachment-bubble">
                          <FileText size={24} />
                          <div className="file-meta">
                            <span className="file-name">{msg.file.name}</span>
                            <span className="file-size">{formatSize(msg.file.size)}</span>
                          </div>
                        </div>
                      )}
                      {msg.text && <p>{msg.text}</p>}
                    </div>
                    <div className="msg-meta">
                      <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selectedFile.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(selectedFile)} alt="preview" className="file-thumb" />
                ) : <FileText size={16} color="#F59E0B" />}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="preview-name">{selectedFile.name}</span>
                  <span className="preview-size">{formatSize(selectedFile.size)}</span>
                </div>
              </div>
              <button onClick={() => setSelectedFile(null)} className="remove-file-btn"><X size={14} /></button>
            </div>
          )}
          <form onSubmit={handleSend} className="chat-input-area" style={{ borderTop: 'none', padding: '0 1.5rem 1rem' }}>
            <div className="input-bar" style={{ borderRadius: 28 }}>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx" hidden />
              <button type="button" className="icon-btn" onClick={() => fileInputRef.current.click()}><Paperclip size={20} /></button>
              <input type="text" placeholder="Type a message..." value={inputMsg} onChange={e => setInputMsg(e.target.value)} className="chat-input-field" />
              <div className="picker-container" ref={pickerRef}>
                <button type="button" className="icon-btn" onClick={() => setShowPicker(!showPicker)}><Smile size={20} /></button>
                {showPicker && (
                  <div className="emoji-picker-panel">
                    <div className="picker-tabs">
                      <button type="button" className={pickerTab === 'emoji' ? 'active' : ''} onClick={() => setPickerTab('emoji')}>Emoji</button>
                      <button type="button" className={pickerTab === 'sticker' ? 'active' : ''} onClick={() => setPickerTab('sticker')}>Stickers</button>
                    </div>
                    <div className="picker-content">
                      {pickerTab === 'emoji' ? (
                        <div className="emoji-grid">
                          {EMOJIS.map((e, i) => <span key={i} onClick={() => { setInputMsg(p => p + e); setShowPicker(false); }}>{e}</span>)}
                        </div>
                      ) : (
                        <div className="sticker-grid">
                          {STICKERS.map((s, i) => <img key={i} src={s} alt="sticker" onClick={() => sendSticker(s)} />)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button type="submit" className="send-btn" disabled={!inputMsg.trim() && !selectedFile}><Send size={18} /></button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
