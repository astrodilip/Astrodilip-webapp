import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, PhoneCall, User, LogOut, Calendar } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('astrology_user');
    if (saved) {
      setUser(JSON.parse(saved));
    } else {
      setUser(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('astrology_user');
    setUser(null);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          <img src="/logo.svg" alt="Logo" className="nav-logo-img" />
          <span className="nav-logo-text">Astro Dilip Sharma</span>
        </Link>
        
        <div className={`nav-links ${isOpen ? 'active' : ''}`}>
          <Link to="/" className={location.pathname === '/' ? 'active-link' : ''} onClick={closeMenu}>Home</Link>
          <Link to="/booking" className={location.pathname === '/booking' ? 'active-link' : ''} onClick={closeMenu}>Consultation</Link>
          <Link to="/reports" className={location.pathname === '/reports' ? 'active-link' : ''} onClick={closeMenu}>Reports</Link>
          <Link to="/courses" className={location.pathname === '/courses' ? 'active-link' : ''} onClick={closeMenu}>Courses</Link>
          <Link to="/calculators" className={location.pathname === '/calculators' ? 'active-link' : ''} onClick={closeMenu}>Free Calculators</Link>
          <Link to="/about" className={location.pathname === '/about' ? 'active-link' : ''} onClick={closeMenu}>About Us</Link>
          {user && (
            <Link to="/my-bookings" className={location.pathname === '/my-bookings' ? 'active-link' : ''} onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={16} /> My Bookings
            </Link>
          )}
        </div>

        <div className="nav-actions">
          {user ? (
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <div className="nav-user-info">
                <User size={18} color="var(--primary)" /> <span className="nav-user-name">{user.name.split(' ')[0]}</span>
              </div>
              <button onClick={handleLogout} style={{background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center'}} title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="phone-btn" style={{textDecoration: 'none'}}>
              <User size={18} />
              <span>Login</span>
            </Link>
          )}
          
          <a href="tel:7414858885" className="phone-btn">
            <PhoneCall size={18} />
            <span>7414858885</span>
          </a>
          <button className="mobile-menu-btn" onClick={toggleMenu}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

