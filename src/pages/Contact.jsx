import React from 'react';

const Contact = () => {
  return (
    <div className="container" style={{ padding: '8rem 2rem 5rem', minHeight: '80vh', textAlign: 'center' }}>
      <h1 className="section-title">Contact Us</h1>
      <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem', color: 'var(--text-muted)' }}>
        Have a question or need assistance? Reach out to our support team and we will get back to you as soon as possible.
      </p>
      
      <div className="glass-card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'left' }}>
        <h3 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Contact Information</h3>
        <p style={{ marginBottom: '0.5rem' }}><strong>Phone:</strong> +91 7414858885</p>
        <p style={{ marginBottom: '0.5rem' }}><strong>Email:</strong> info@astrodilipsharma.com</p>
        <p><strong>Address:</strong> Jaipur, Rajasthan, India</p>
      </div>
    </div>
  );
};

export default Contact;
