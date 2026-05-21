import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Phone, Video } from 'lucide-react';

const Consultation = () => {
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
          <button className="btn-primary" style={{ display: 'flex', justifyContent: 'center', width: '100%', fontSize: '1.2rem', padding: '1rem' }}>
            <Phone size={24} style={{ marginRight: '10px' }} /> Start Voice Call
          </button>
          <button className="btn-primary" style={{ display: 'flex', justifyContent: 'center', width: '100%', fontSize: '1.2rem', padding: '1rem' }}>
            <Video size={24} style={{ marginRight: '10px' }} /> Start Video Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default Consultation;
