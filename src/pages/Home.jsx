import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Shield, Users, BookOpen, Sun } from 'lucide-react';
import './Home.css';
import heroImg from '../assets/hero-image.png';

const ScrollReveal = ({ children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      });
    }, { threshold: 0.15 });

    const { current } = domRef;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  return (
    <div
      className={`${className} scroll-reveal ${isVisible ? 'is-visible' : ''}`}
      ref={domRef}
    >
      {children}
    </div>
  );
};

// Service Images
import imgFree from '../assets/services/free.png';
import imgSunSigns from '../assets/services/sun_signs.png';
import imgLove from '../assets/services/love.png';
import imgMarriage from '../assets/services/marriage.png';
import imgCareer from '../assets/services/career.png';
import imgFinance from '../assets/services/finance.png';
import imgChild from '../assets/services/child.png';
import imgEducation from '../assets/services/education.png';

const Home = () => {
  const astroServices = [
    { id: 1, title: 'Free Astrology', image: imgFree, link: '/calculators' },
    { id: 2, title: 'Sun Signs', image: imgSunSigns, link: '/reports' },
    { id: 3, title: 'Love', image: imgLove, link: '/reports' },
    { id: 4, title: 'Marriage', image: imgMarriage, link: '/reports' },
    { id: 5, title: 'Career', image: imgCareer, link: '/reports' },
    { id: 6, title: 'Finance', image: imgFinance, link: '/reports' },
    { id: 7, title: 'Child Astro', image: imgChild, link: '/reports' },
    { id: 8, title: 'Education', image: imgEducation, link: '/reports' }
  ];

  const horoscopes = [
    { id: 1, name: 'Aries', icon: 'https://img.icons8.com/color/96/aries.png' },
    { id: 2, name: 'Taurus', icon: 'https://img.icons8.com/color/96/taurus.png' },
    { id: 3, name: 'Gemini', icon: 'https://img.icons8.com/color/96/gemini.png' },
    { id: 4, name: 'Cancer', icon: 'https://img.icons8.com/color/96/cancer.png' },
    { id: 5, name: 'Leo', icon: 'https://img.icons8.com/color/96/leo.png' },
    { id: 6, name: 'Virgo', icon: 'https://img.icons8.com/color/96/virgo.png' },
    { id: 7, name: 'Libra', icon: 'https://img.icons8.com/color/96/libra.png' },
    { id: 8, name: 'Scorpio', icon: 'https://img.icons8.com/color/96/scorpio.png' },
    { id: 9, name: 'Sagittarius', icon: 'https://img.icons8.com/color/96/sagittarius.png' },
    { id: 10, name: 'Capricorn', icon: 'https://img.icons8.com/color/96/capricorn.png' },
    { id: 11, name: 'Aquarius', icon: 'https://img.icons8.com/color/96/aquarius.png' },
    { id: 12, name: 'Pisces', icon: 'https://img.icons8.com/color/96/pisces.png' }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Navigate Your Destiny with <br />
              <span className="text-gradient">Astro Dilip Sharma</span>
            </h1>
            <p className="hero-subtitle">
              India's premier astrologer. Discover the cosmic blueprint of your life with expert Vedic astrology, numerology, and Vastu consultations.
            </p>
            <div className="hero-actions">
              <Link to="/consultation" className="btn-primary">
                Book Consultation <ArrowRight size={18} />
              </Link>
              <Link to="/calculators" className="btn-outline">
                Free Kundli
              </Link>
            </div>
            <div className="trust-badges">
              <div className="badge">
                <Users size={20} className="badge-icon" />
                <span>1M+ Users</span>
              </div>
              <div className="badge">
                <Star size={20} className="badge-icon" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="badge">
                <Shield size={20} className="badge-icon" />
                <span>100% Privacy</span>
              </div>
            </div>
          </div>
          <div className="hero-image-wrapper">
            <div className="glow-circle"></div>
            <img src={heroImg} alt="Astro Dilip Sharma" className="hero-image" />
          </div>
        </div>
      </section>

      {/* New Services Grid */}
      <section className="new-services-section">
        <ScrollReveal className="container section-big-card">
          <div className="new-services-header">
            <h2 className="new-services-title">We Provide Best Astro Services For You</h2>
          </div>
          <div className="new-services-grid">
            {astroServices.map((service, index) => (
              <Link 
                to={service.link} 
                key={service.id} 
                className="new-service-card fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <img src={service.image} alt={service.title} className="new-service-img" />
                <h3 className="new-service-title">{service.title}</h3>
              </Link>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Horoscope Section */}
      <section className="horoscope-section">
        <ScrollReveal className="container section-big-card" style={{ position: 'relative' }}>
          <div className="language-selector">
            <select>
              <option>English</option>
              <option>Hindi</option>
            </select>
          </div>
          <div className="horoscope-header">
            <h2 className="horoscope-title">Choose Your Horoscope</h2>
          </div>
          <div className="horoscope-grid">
            {horoscopes.map((sign, index) => (
              <Link 
                to={`/calculators?sign=${sign.name.toLowerCase()}`} 
                key={sign.id} 
                className="horoscope-card fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <img src={sign.icon} alt={sign.name} className="horoscope-icon" />
                <span className="horoscope-name">{sign.name}</span>
              </Link>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Free Kundli CTA */}
      <section className="kundli-cta-section">
        <div className="container">
          <div className="kundli-banner glass-card">
            <div className="kundli-banner-content">
              <h2>Generate Your Free Online Kundli</h2>
              <p>Get your detailed Janam Kundli with comprehensive predictions, planetary positions, and Dasha details absolutely free.</p>
              <Link to="/calculators" className="btn-primary">Generate Now</Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials / Stats */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <h3 className="text-gradient">15+</h3>
              <p>Years Experience</p>
            </div>
            <div className="stat-item">
              <h3 className="text-gradient">50k+</h3>
              <p>Happy Clients</p>
            </div>
            <div className="stat-item">
              <h3 className="text-gradient">100+</h3>
              <p>Countries Served</p>
            </div>
            <div className="stat-item">
              <h3 className="text-gradient">24/7</h3>
              <p>Support</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
