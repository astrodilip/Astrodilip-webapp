import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Phone, Video, CalendarX } from 'lucide-react';

const Consultation = () => {
  const navigate = useNavigate();
  const [hasBooking, setHasBooking] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('astrology_user');
    if (!saved) { navigate('/login'); return; }
    const parsedUser = JSON.parse(saved);

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
  }, [navigate]);

  if (loadingBooking) {
    return (
      <div className="container" style={{ padding: '8rem 2rem 5rem', minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
          <p style={{ color: '#fff' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasBooking) {
    return (
      <div className="container" style={{ padding: '8rem 2rem 5rem', minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: '#F59E0B' }}>
            <CalendarX size={64} />
          </div>
          <h2 style={{ marginBottom: '1rem', color: '#fff' }}>Appointment Required</h2>
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

  return (
    <div className="container" style={{ padding: '8rem 2rem 5rem', minHeight: '80vh', textAlign: 'center' }}>
      <h1 className="section-title">Book a Consultation</h1>
      <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem', color: 'var(--text-muted)' }}>
        Connect with Astro Dilip Sharma for personalized guidance. Choose from a variety of consultation types including video, phone, or in-person sessions.
      </p>
      
      <div className="glass-card" style={{ maxWidth: '600px', margin: '3rem auto' }}>
        <h2 style={{ marginBottom: '2rem' }}>Choose Consultation Mode</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link to="/chat" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', width: '100%', fontSize: '1.2rem', padding: '1rem', textDecoration: 'none' }}>
            <MessageCircle size={24} style={{ marginRight: '10px' }} /> Start Chat
          </Link>
          <Link to="/chat" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', width: '100%', fontSize: '1.2rem', padding: '1rem', textDecoration: 'none' }}>
            <Phone size={24} style={{ marginRight: '10px' }} /> Start Voice Call
          </Link>
          <Link to="/chat" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', width: '100%', fontSize: '1.2rem', padding: '1rem', textDecoration: 'none' }}>
            <Video size={24} style={{ marginRight: '10px' }} /> Start Video Call
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Consultation;
