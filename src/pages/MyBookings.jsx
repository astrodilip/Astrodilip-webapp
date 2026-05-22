import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Phone, MessageSquare, Calendar, Clock, CreditCard, Sparkles } from 'lucide-react';
import './MyBookings.css';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(userStr);
    fetchBookings(user.id || user._id);
  }, [navigate]);

  const fetchBookings = async (userId) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`https://astrodilip-webapp.onrender.com/api/bookings/${userId}`);
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await fetch(`https://astrodilip-webapp.onrender.com/api/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
      } else {
        alert('Failed to cancel booking.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = (booking) => {
    // Determine the route to join based on type. For chat, it's /chat. For calls, also /chat where call signaling happens.
    navigate('/chat');
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const getTypeIcon = (type) => {
    if (type === 'video') return <Video size={16} />;
    if (type === 'audio') return <Phone size={16} />;
    return <MessageSquare size={16} />;
  };

  const isJoinable = (booking) => {
    if (booking.status !== 'confirmed') return false;
    
    // Check if the booking date and time is within 10 mins from now or active
    // This is a simplified check for the UI
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // For simplicity, let's just say if it's today and confirmed, it's joinable. 
    // Real logic would parse `booking.timeSlot` (e.g., "9:30 AM") to check 10 min window.
    if (booking.date === todayStr) {
      return true;
    }
    return false;
  };

  const isCancellable = (booking) => {
    if (booking.status === 'pending' || booking.status === 'confirmed') {
      const now = new Date();
      const bookingDate = new Date(booking.date);
      // Cancel allowed if it's in the future
      if (bookingDate >= now.setHours(0,0,0,0)) return true;
    }
    return false;
  };

  return (
    <div className="my-bookings-page">
      <div className="stars-bg"></div>
      
      <div className="my-bookings-container">
        <h1 className="page-title">
          <Sparkles className="sparkle-icon" />
          My Consultations
        </h1>

        {loading ? (
          <div className="loading-state">Loading your bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} className="empty-icon" />
            <h2>No bookings found</h2>
            <p>You haven't scheduled any consultations yet.</p>
            <button className="book-now-btn" onClick={() => navigate('/booking')}>Book a Consultation</button>
          </div>
        ) : (
          <div className="bookings-grid">
            {bookings.map((booking) => (
              <div key={booking._id} className="booking-card">
                <div className="booking-card-header">
                  <div className="booking-type">
                    {getTypeIcon(booking.consultationType)}
                    <span className="type-text">{booking.consultationType} Consultation</span>
                  </div>
                  <span className={`status-badge ${getStatusClass(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>

                <div className="booking-details">
                  <div className="detail-item">
                    <Calendar size={16} className="detail-icon" />
                    <span>{new Date(booking.date).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="detail-item">
                    <Clock size={16} className="detail-icon" />
                    <span>{booking.timeSlot} (30 mins)</span>
                  </div>
                  <div className="detail-item">
                    <CreditCard size={16} className="detail-icon" />
                    <span>₹{booking.amount}</span>
                  </div>
                </div>

                <div className="booking-actions">
                  {isCancellable(booking) && (
                    <button className="btn-cancel" onClick={() => handleCancel(booking._id)}>
                      Cancel
                    </button>
                  )}
                  {isJoinable(booking) && (
                    <button className="btn-join" onClick={() => handleJoin(booking)}>
                      Join Session
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
