import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone } from 'lucide-react';
import './VideoCall.css';

// ICE servers (STUN) - free Google servers for WebRTC connection
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

const VideoCall = ({
  socket,
  callType,           // 'video' or 'audio'
  remoteSocketId,     // socket id of the other person
  remoteUserName,     // name of the other person
  isIncoming,         // true = we received the call, false = we made the call
  onEndCall,          // callback when call ends
  callerSocketId,     // only for incoming calls - who called us
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  // BUG 4 FIX: Queue ICE candidates that arrive before remoteDescription is set
  const iceCandidateQueueRef = useRef([]);
  const remoteDescSetRef = useRef(false);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callStatus, setCallStatus] = useState('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);

  // ── Start local media (camera/mic) ──
  const startLocalStream = async () => {
    try {
      const constraints = {
        audio: true,
        video: callType === 'video'
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      alert('Could not access camera/microphone. Please allow permissions and try again.');
      onEndCall();
    }
  };

  // BUG 4 FIX: Safely add ICE candidate only after remote description is set
  const safeAddIceCandidate = async (candidate) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    if (remoteDescSetRef.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('ICE candidate error:', e);
      }
    } else {
      // Queue it — will be flushed after setRemoteDescription
      iceCandidateQueueRef.current.push(candidate);
    }
  };

  // BUG 4 FIX: Flush all queued ICE candidates after remote description is set
  const flushIceCandidateQueue = async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;
    remoteDescSetRef.current = true;
    for (const candidate of iceCandidateQueueRef.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('Queued ICE candidate error:', e);
      }
    }
    iceCandidateQueueRef.current = [];
  };

  // ── Create Peer Connection ──
  const createPeerConnection = (stream, dynamicTarget = null) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const target = dynamicTarget || remoteSocketId || callerSocketId;
        socket.emit('ice_candidate', {
          targetSocketId: target,
          candidate: event.candidate
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallStatus('active');
        startTimer();
      }
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        handleEndCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // ── Caller: create and send offer ──
  const startCall = async (accepterSocketId) => {
    let stream = localStreamRef.current;
    if (!stream) stream = await startLocalStream();
    if (!stream) return;

    const pc = createPeerConnection(stream, accepterSocketId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('webrtc_offer', {
      targetSocketId: accepterSocketId || remoteSocketId,
      offer
    });
  };

  // ── Callee: handle incoming offer, send answer ──
  const handleOffer = async (offer, callerSockId) => {
    const stream = await startLocalStream();
    if (!stream) return;

    const pc = createPeerConnection(stream, callerSockId);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    // BUG 4 FIX: Flush any ICE candidates that arrived before the offer
    await flushIceCandidateQueue();

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('webrtc_answer', {
      targetSocketId: callerSockId,
      answer
    });
  };

  // ── Start call timer ──
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── End call cleanup ──
  const handleEndCall = () => {
    clearInterval(timerRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    const target = remoteSocketId || callerSocketId;
    if (target) {
      socket.emit('end_call', { targetSocketId: target });
    }
    setCallStatus('ended');
    setTimeout(() => onEndCall(), 1000);
  };

  // ── Toggle Mute ──
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  };

  // ── Toggle Camera ──
  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(prev => !prev);
    }
  };

  // ── Socket listeners & call init ──
  useEffect(() => {
    if (!isIncoming) {
      startLocalStream();
      socket.on('call_accepted', ({ accepterSocketId }) => {
        setTimeout(() => startCall(accepterSocketId), 300);
      });
    }

    socket.on('webrtc_offer', ({ offer, callerSocketId: callerSockId }) => {
      handleOffer(offer, callerSockId);
    });

    socket.on('webrtc_answer', async ({ answer }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        // BUG 4 FIX: Flush queued ICE candidates now that remote description is set
        await flushIceCandidateQueue();
      }
    });

    // BUG 4 FIX: Use safeAddIceCandidate instead of adding directly
    socket.on('ice_candidate', ({ candidate }) => {
      if (candidate) {
        safeAddIceCandidate(candidate);
      }
    });

    socket.on('call_ended', () => {
      clearInterval(timerRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
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
    };
  }, []);

  useEffect(() => {
    if (isIncoming) {
      startLocalStream();
    }
  }, []);

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
              <span></span><span></span><span></span><span></span><span></span>
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
