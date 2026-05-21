import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, Mic } from 'lucide-react';
import './CallNotification.css';

const CallNotification = ({
  callerName,       // Name of the person calling
  callType,         // 'video' or 'audio'
  onAccept,         // callback when user accepts
  onReject,         // callback when user rejects
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const audioRef = useRef(null);

  // Animate in on mount
  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Ringtone using Web Audio API (no external file needed)
  useEffect(() => {
    let ctx = null;
    let stopped = false;

    const ring = async () => {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        const playBeep = (freq, start, duration) => {
          if (stopped) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
          gain.gain.setValueAtTime(0, ctx.currentTime + start);
          gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + start + 0.02);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration - 0.02);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + duration);
        };

        const ringCycle = () => {
          if (stopped) return;
          playBeep(880, 0, 0.25);
          playBeep(1100, 0.3, 0.25);
          playBeep(880, 0.6, 0.25);
          playBeep(1100, 0.9, 0.25);
        };

        ringCycle();
        const interval = setInterval(() => {
          if (!stopped) ringCycle();
        }, 2500);

        return () => {
          stopped = true;
          clearInterval(interval);
          ctx?.close();
        };
      } catch (_) {
        // Audio not available - silent fallback
      }
    };

    const cleanup = ring();
    return () => {
      stopped = true;
      cleanup?.then?.(fn => fn?.());
      ctx?.close();
    };
  }, []);

  const handleAccept = () => {
    setIsVisible(false);
    setTimeout(onAccept, 200);
  };

  const handleReject = () => {
    setIsVisible(false);
    setTimeout(onReject, 200);
  };

  const initial = callerName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className={`cn-backdrop ${isVisible ? 'cn-visible' : ''}`}>
      <div className={`cn-card ${isVisible ? 'cn-card-in' : ''}`}>

        {/* Ripple rings behind avatar */}
        <div className="cn-ripple-wrap">
          <span className="cn-ripple cn-ripple-1" />
          <span className="cn-ripple cn-ripple-2" />
          <span className="cn-ripple cn-ripple-3" />
          <div className="cn-avatar">{initial}</div>
        </div>

        {/* Caller info */}
        <div className="cn-info">
          <p className="cn-label">
            {callType === 'video' ? '📹 Incoming Video Call' : '🎙️ Incoming Voice Call'}
          </p>
          <h2 className="cn-name">{callerName || 'Unknown'}</h2>
          <p className="cn-sublabel">
            {callType === 'video' ? 'wants to video call you' : 'is calling you'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="cn-actions">
          {/* Reject */}
          <div className="cn-action-wrap">
            <button className="cn-btn cn-btn-reject" onClick={handleReject} aria-label="Decline call">
              <PhoneOff size={26} />
            </button>
            <span className="cn-action-label">Decline</span>
          </div>

          {/* Accept */}
          <div className="cn-action-wrap">
            <button className="cn-btn cn-btn-accept" onClick={handleAccept} aria-label="Accept call">
              {callType === 'video' ? <Video size={26} /> : <Phone size={26} />}
            </button>
            <span className="cn-action-label">Accept</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CallNotification;
