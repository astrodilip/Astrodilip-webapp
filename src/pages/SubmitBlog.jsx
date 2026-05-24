import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Image as ImageIcon } from 'lucide-react';

const SubmitBlog = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    author: '',
    image: '',
    status: 'pending' // important: mark it as pending
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Auto-set the current date
    const today = new Date().toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    
    const payload = {
      ...formData,
      date: today
    };

    try {
      const res = await fetch('https://astrodilip-webapp.onrender.com/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert('Thank you for sharing your experience! It has been sent to Astro Dilip Sharma for review.');
        navigate('/');
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit blog request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        let result = reader.result;
        if (!result.startsWith('data:image/')) {
          const base64Data = result.split('base64,')[1];
          result = `data:image/jpeg;base64,${base64Data}`;
        }
        setFormData({ ...formData, image: result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="home-page" style={{ paddingTop: '100px', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="blog-cta-card" style={{ textAlign: 'left', padding: '2rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
            Share Your Cosmic Experience
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.5' }}>
            We would love to hear how Astro Dilip Sharma's guidance or remedies helped you. Submit your story below, and once approved, it will be published on our home page!
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Your Name:</label>
              <input 
                type="text" 
                placeholder="e.g. Priya M." 
                value={formData.author} 
                onChange={(e) => setFormData({...formData, author: e.target.value})} 
                required 
                style={{ padding: '12px', borderRadius: '8px', border: '2px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Title of Your Experience:</label>
              <input 
                type="text" 
                placeholder="e.g. How Vastu Changed My Life" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                required 
                style={{ padding: '12px', borderRadius: '8px', border: '2px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Your Story:</label>
              <textarea 
                placeholder="Share your experience in detail..." 
                value={formData.excerpt} 
                onChange={(e) => setFormData({...formData, excerpt: e.target.value})} 
                required 
                rows="6" 
                style={{ padding: '12px', borderRadius: '8px', border: '2px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', resize: 'vertical' }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Attach a Photo (Optional but Recommended):</label>
              <div style={{ position: 'relative' }}>
                <input 
                  id="user-blog-image"
                  type="file" 
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                <button 
                  type="button" 
                  onClick={() => document.getElementById('user-blog-image').click()}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '2px dashed var(--accent)', padding: '12px 20px', borderRadius: '8px', color: 'var(--accent)', fontWeight: 'bold', cursor: 'pointer', width: '100%', justifyContent: 'center' }}
                >
                  <ImageIcon size={20} /> Choose Photo
                </button>
              </div>
              
              {formData.image && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', background: 'rgba(26,20,0,0.05)', padding: '8px', borderRadius: '8px' }}>
                  <img src={formData.image} alt="preview" style={{ height: '50px', width: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                  <button 
                    type="button" 
                    onClick={() => {
                      setFormData({...formData, image: ''});
                      document.getElementById('user-blog-image').value = '';
                    }}
                    style={{ background: 'transparent', color: '#DC2626', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '14px' }}
            >
              {isSubmitting ? 'Sending...' : <><Send size={18} /> Submit Experience</>}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmitBlog;
