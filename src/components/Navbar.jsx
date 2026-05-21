import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, PhoneCall, User, LogOut } from 'lucide-react';
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
      <div className="container nav-container">
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          Astro Dilip Sharma
        </Link>
        
        <div className={`nav-links ${isOpen ? 'active' : ''}`}>
          <Link to="/" className={location.pathname === '/' ? 'active-link' : ''} onClick={closeMenu}>Home</Link>
          <Link to="/consultation" className={location.pathname === '/consultation' ? 'active-link' : ''} onClick={closeMenu}>Consultation</Link>
          <Link to="/reports" className={location.pathname === '/reports' ? 'active-link' : ''} onClick={closeMenu}>Reports</Link>
          <Link to="/courses" className={location.pathname === '/courses' ? 'active-link' : ''} onClick={closeMenu}>Courses</Link>
          <Link to="/calculators" className={location.pathname === '/calculators' ? 'active-link' : ''} onClick={closeMenu}>Free Calculators</Link>
          <Link to="/contact" className={location.pathname === '/contact' ? 'active-link' : ''} onClick={closeMenu}>Contact</Link>
        </div>

        <div className="nav-actions">
          {user ? (
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff'}}>
                <User size={18} color="#F59E0B" /> <span style={{fontSize: '0.9rem'}}>{user.name.split(' ')[0]}</span>
              </div>
              <button onClick={handleLogout} style={{background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center'}} title="Logout">
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
