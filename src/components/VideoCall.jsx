import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import './VideoCall.css';

// ─────────────────────────────────────────────────────────────
// FIX 1: Added TURN servers — required for production/Render.
// STUN-only works on localhost but fails across real networks.
// These free Open Relay TURN servers relay media when peers
// can't connect directly (firewalls, NAT, mobile networks).
// ─────────────────────────────────────────────────────────────
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ]
};

const VideoCall = ({
  socket,
  callType,
  remoteSocketId,
  remoteUserName,
  isIncoming,
  onEndCall,
  callerSocketId,
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  // ICE candidate queue — candidates can arrive before remoteDescription is set
  const iceCandidateQueueRef = useRef([]);
  const remoteDescSetRef = useRef(false);

  // ─────────────────────────────────────────────────────────────
  // FIX 2: Store the live target socket ID in a ref so handleEndCall
  // always sends end_call to the correct socket, even if it changed
  // after the component mounted (race condition on Render).
  // ─────────────────────────────────────────────────────────────
  const liveTargetRef = useRef(remoteSocketId || callerSocketId || null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callStatus, setCallStatus] = useState('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);

  // ─────────────────────────────────────────────────────────────
  // FIX 3: disconnectCountRef — don't end the call immediately on
  // 'disconnected'. Give it 4 seconds to auto-recover (it often
  // does on mobile/WiFi switches). Only end on 'failed' or if
  // 'disconnected' persists.
  // ─────────────────────────────────────────────────────────────
  const disconnectTimerRef = useRef(null);

  // ── Start local media ──
  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error('Media device error:', err);
      alert('Could not access camera/microphone. Please allow permissions and try again.');
      onEndCall();
    }
  };

  // ── Safe ICE candidate (queues if remoteDesc not set yet) ──
  const safeAddIceCandidate = async (candidate) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;
    if (remoteDescSetRef.current) {
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
      catch (e) { console.warn('ICE add error:', e); }
    } else {
      iceCandidateQueueRef.current.push(candidate);
    }
  };

  // ── Flush queued ICE candidates after remoteDesc is set ──
  const flushIceCandidateQueue = async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;
    remoteDescSetRef.current = true;
    for (const c of iceCandidateQueueRef.current) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); }
      catch (e) { console.warn('Queued ICE error:', e); }
    }
    iceCandidateQueueRef.current = [];
  };

  // ── Create peer connection ──
  const createPeerConnection = (stream, targetId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const target = targetId || liveTargetRef.current;
        if (target) {
          socket.emit('ice_candidate', { targetSocketId: target, candidate: event.candidate });
        }
      }
    };

    // FIX 3: Don't end call on 'disconnected' — wait 4s for recovery
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('WebRTC connection state:', state);

      if (state === 'connected') {
        clearTimeout(disconnectTimerRef.current);
        setCallStatus('active');
        startTimer();
      }

      if (state === 'disconnected') {
        // Give 4 seconds to auto-recover before ending
        disconnectTimerRef.current = setTimeout(() => {
          if (peerConnectionRef.current?.connectionState !== 'connected') {
            handleEndCall();
          }
        }, 4000);
      }

      if (state === 'failed') {
        // 'failed' is unrecoverable — end immediately
        clearTimeout(disconnectTimerRef.current);
        handleEndCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // ── Caller: create offer ──
  const startCall = async (accepterSocketId) => {
    // Update live target ref with the real accepter socket ID
    if (accepterSocketId) liveTargetRef.current = accepterSocketId;

    let stream = localStreamRef.current;
    if (!stream) stream = await startLocalStream();
    if (!stream) return;

    const pc = createPeerConnection(stream, accepterSocketId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('webrtc_offer', {
      targetSocketId: accepterSocketId || liveTargetRef.current,
      offer,
    });
  };

  // ── Callee: handle offer → send answer ──
  const handleOffer = async (offer, callerSockId) => {
    if (callerSockId) liveTargetRef.current = callerSockId;

    const stream = await startLocalStream();
    if (!stream) return;

    const pc = createPeerConnection(stream, callerSockId);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    await flushIceCandidateQueue();

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('webrtc_answer', { targetSocketId: callerSockId, answer });
  };

  // ── Timer ──
  const startTimer = () => {
    if (timerRef.current) return; // prevent double-start
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── End call ──
  const handleEndCall = () => {
    clearInterval(timerRef.current);
    clearTimeout(disconnectTimerRef.current);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // FIX 2: Use liveTargetRef — always has the correct current socket ID
    const target = liveTargetRef.current;
    if (target) {
      socket.emit('end_call', { targetSocketId: target });
    }

    setCallStatus('ended');
    setTimeout(() => onEndCall(), 1000);
  };

  // ── Toggle mute / camera ──
  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(prev => !prev);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCameraOff(prev => !prev);
  };

  // ─────────────────────────────────────────────────────────────
  // FIX 4: call_accepted is now handled in Chat.jsx/Admin.jsx
  // BEFORE VideoCall mounts, so by the time this component runs
  // its useEffect the accepterSocketId is passed in as a prop
  // (remoteSocketId). No race condition.
  //
  // But we ALSO listen here as a fallback in case the event
  // fires slightly after mount (timing edge case on slow networks).
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Start local stream immediately on mount (for both caller & callee)
    startLocalStream();

    // Caller: if call_accepted fires after mount (slow network edge case)
    if (!isIncoming) {
      socket.on('call_accepted', ({ accepterSocketId }) => {
        // Small delay to ensure local stream is ready
        setTimeout(() => startCall(accepterSocketId), 200);
      });
    }

    // Callee receives offer
    socket.on('webrtc_offer', ({ offer, callerSocketId: callerSockId }) => {
      handleOffer(offer, callerSockId);
    });

    // Caller receives answer
    socket.on('webrtc_answer', async ({ answer }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        await flushIceCandidateQueue();
      }
    });

    // ICE candidates
    socket.on('ice_candidate', ({ candidate }) => {
      if (candidate) safeAddIceCandidate(candidate);
    });

    // Remote ended the call
    socket.on('call_ended', () => {
      clearInterval(timerRef.current);
      clearTimeout(disconnectTimerRef.current);
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      peerConnectionRef.current?.close();
      setCallStatus('ended');
      setTimeout(() => onEndCall(), 1000);
    });

    return () => {
      socket.off('call_accepted');
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('ice_candidate');
      socket.off('call_ended');
      clearInterval(timerRef.current);
      clearTimeout(disconnectTimerRef.current);
    };
  }, []);

  // ── JSX ──
  return (
    <div className={`vc-overlay ${callType === 'audio' ? 'vc-audio-mode' : ''}`}>
      <div className="vc-container">

        <div className="vc-header">
          <div className="vc-caller-info">
            <div className="vc-avatar">
              {remoteUserName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="vc-caller-name">{remoteUserName || 'User'}</div>
              <div className="vc-status">
                {callStatus === 'connecting' && '⏳ Connecting...'}
                {callStatus === 'active' && `🟢 ${formatDuration(callDuration)}`}
                {callStatus === 'ended' && '📴 Call Ended'}
              </div>
            </div>
          </div>
          <div className="vc-call-type-badge">
            {callType === 'video' ? '📹 Video Call' : '🎙️ Voice Call'}
          </div>
        </div>

        {callType === 'video' && (
          <div className="vc-video-area">
            <video ref={remoteVideoRef} autoPlay playsInline className="vc-remote-video" />
            <video ref={localVideoRef} autoPlay playsInline muted className="vc-local-video" />
          </div>
        )}

        {callType === 'audio' && (
          <div className="vc-audio-area">
            <div className="vc-audio-avatar">
              {remoteUserName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="vc-audio-waves">
              <span /><span /><span /><span /><span />
            </div>
            <video ref={remoteVideoRef} autoPlay playsInline style={{ display: 'none' }} />
            <video ref={localVideoRef} autoPlay playsInline muted style={{ display: 'none' }} />
          </div>
        )}

        <div className="vc-controls">
          <button
            className={`vc-btn ${isMuted ? 'vc-btn-active' : ''}`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {callType === 'video' && (
            <button
              className={`vc-btn ${isCameraOff ? 'vc-btn-active' : ''}`}
              onClick={toggleCamera}
              title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
              <span>{isCameraOff ? 'Cam On' : 'Cam Off'}</span>
            </button>
          )}

          <button className="vc-btn vc-btn-end" onClick={handleEndCall} title="End Call">
            <PhoneOff size={22} />
            <span>End</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default VideoCall;
