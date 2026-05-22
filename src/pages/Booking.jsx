import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Phone, Video, Calendar, Clock, MapPin, Sparkles } from 'lucide-react';
import './Booking.css';

const Booking = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    tob: '',
    dontKnowTime: false,
    pob: '',
    question: ''
  });

  const consultationTypes = [
    { id: 'chat', title: 'Chat Consultation', price: 299, duration: '30 mins', icon: MessageSquare },
    { id: 'audio', title: 'Voice Call', price: 499, duration: '30 mins', icon: Phone },
    { id: 'video', title: 'Video Call', price: 799, duration: '30 mins', icon: Video }
  ];

  // Load user data if logged in
  useEffect(() => {
    const userStr = localStorage.getItem('astrology_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setFormData(prev => ({ ...prev, name: user.name || '', email: user.email || '', phone: user.phone || '' }));
    } else {
      // User is not logged in, silently redirect
      navigate('/login');
    }
  }, [navigate]);

  // Generate next 14 dates
  const generateDates = () => {
    const dates = [];
    let d = new Date();
    for (let i = 0; i < 14; i++) {
      dates.push({
        fullDate: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateNum: d.getDate()
      });
      d.setDate(d.getDate() + 1);
    }
    return dates;
  };
  const dates = generateDates();

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchSlots = async (date) => {
    setLoadingSlots(true);
    setSelectedTime(null);
    try {
      const res = await fetch(`https://astrodilip-webapp.onrender.com/api/slots?date=${date}`);
      const data = await res.json();
      setAvailableSlots(data.slots || []);
    } catch (err) {
      console.error('Failed to fetch slots', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getSelectedTypeData = () => {
    return consultationTypes.find(t => t.id === selectedType) || {};
  };

  const handleConfirm = async () => {
    if (!selectedType || !selectedDate || !selectedTime) {
      return alert('Please select a consultation type, date, and time slot.');
    }
    if (!formData.name || !formData.email || !formData.phone || !formData.dob || !formData.pob || !formData.question) {
      return alert('Please fill in all required birth details.');
    }
    if (!formData.dontKnowTime && !formData.tob) {
      return alert('Please provide your time of birth or check "Don\'t know exact time".');
    }

    const userStr = localStorage.getItem('astrology_user');
    const user = userStr ? JSON.parse(userStr) : {};

    const bookingData = {
      userId: user.id || null, // Assuming localstorage has user.id
      userName: formData.name,
      userEmail: formData.email,
      date: selectedDate,
      timeSlot: selectedTime,
      duration: 30,
      consultationType: selectedType,
      amount: getSelectedTypeData().price,
      notes: `DOB: ${formData.dob}, TOB: ${formData.dontKnowTime ? 'Unknown' : formData.tob}, POB: ${formData.pob}. Q: ${formData.question}`,
      status: 'pending'
    };

    try {
      const res = await fetch('https://astrodilip-webapp.onrender.com/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      if (res.ok) {
        alert('Booking confirmed successfully!');
        navigate('/my-bookings');
      } else {
        alert('Failed to confirm booking.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while booking.');
    }
  };

  return (
    <div className="booking-page">
      <div className="stars-bg"></div>
      
      <div className="booking-container">
        <h1 className="booking-title">
          <Sparkles className="sparkle-icon" />
          Book a Consultation
        </h1>

        <div className="booking-layout">
          <div className="booking-form-area">
            
            {/* Section 1: Type */}
            <div className="booking-section">
              <h2>1. Select Consultation Type</h2>
              <div className="type-cards">
                {consultationTypes.map(type => (
                  <div 
                    key={type.id} 
                    className={`type-card ${selectedType === type.id ? 'selected' : ''}`}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <type.icon size={32} className="type-icon" />
                    <h3>{type.title}</h3>
                    <p className="price">₹{type.price}</p>
                    <p className="duration">{type.duration}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Date */}
            <div className="booking-section">
              <h2>2. Select Date</h2>
              <div className="date-picker">
                {dates.map((d, i) => (
                  <div 
                    key={i}
                    className={`date-card ${selectedDate === d.fullDate ? 'selected' : ''}`}
                    onClick={() => setSelectedDate(d.fullDate)}
                  >
                    <span className="day-name">{d.dayName}</span>
                    <span className="date-num">{d.dateNum}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Time Slot */}
            <div className="booking-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px', paddingBottom: '10px' }}>
                <h2 style={{ borderBottom: 'none', margin: 0, padding: 0 }}>3. Select Time Slot</h2>
                <span style={{ color: '#10B981', fontSize: '0.85rem', fontWeight: 'bold' }}>🕒 Indian Standard Time (IST)</span>
              </div>
              {!selectedDate ? (
                <p className="hint-text">Please select a date first.</p>
              ) : loadingSlots ? (
                <p className="hint-text">Loading available slots...</p>
              ) : (
                <div className="time-slots">
                  {availableSlots.map((slot, i) => (
                    <button
                      key={i}
                      disabled={!slot.available}
                      className={`time-slot ${!slot.available ? 'booked' : ''} ${selectedTime === slot.time ? 'selected' : ''}`}
                      onClick={() => setSelectedTime(slot.time)}
                    >
                      {slot.time}
                      {!slot.available && <span className="booked-label">Booked</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Section 4: Details */}
            <div className="booking-section">
              <h2>4. Birth Details & Question</h2>
              <div className="details-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group time-group">
                    <label>Time of Birth</label>
                    <input 
                      type="time" 
                      name="tob" 
                      value={formData.tob} 
                      onChange={handleInputChange} 
                      disabled={formData.dontKnowTime}
                      required={!formData.dontKnowTime}
                    />
                    <label className="checkbox-label">
                      <input type="checkbox" name="dontKnowTime" checked={formData.dontKnowTime} onChange={handleInputChange} />
                      Don't know exact time
                    </label>
                  </div>
                  <div className="form-group">
                    <label>Place of Birth (City, State)</label>
                    <input type="text" name="pob" value={formData.pob} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Your Question / What to discuss</label>
                  <textarea 
                    name="question" 
                    value={formData.question} 
                    onChange={handleInputChange} 
                    maxLength={500} 
                    rows={4}
                    required
                    placeholder="Briefly describe what you'd like to ask..."
                  />
                  <span className="char-count">{formData.question.length}/500</span>
                </div>
              </div>
            </div>

          </div>

          {/* Section 5: Summary */}
          <div className="booking-summary-wrapper">
            <div className="booking-summary-card">
              <h3>Booking Summary</h3>
              
              <div className="summary-details">
                <div className="summary-item">
                  <span className="label">Type</span>
                  <span className="value">{getSelectedTypeData().title || 'Not selected'}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Date</span>
                  <span className="value">{selectedDate ? new Date(selectedDate).toLocaleDateString('en-GB') : 'Not selected'}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Time</span>
                  <span className="value">{selectedTime || 'Not selected'}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Duration</span>
                  <span className="value">30 minutes</span>
                </div>
                
                <div className="summary-divider"></div>
                
                <div className="summary-total">
                  <span>Total Amount</span>
                  <span className="total-price">₹{getSelectedTypeData().price || 0}</span>
                </div>
              </div>

              <button className="confirm-btn" onClick={handleConfirm}>
                Confirm Booking
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Booking;
