import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <h3>Astro Dilip Sharma</h3>
            <p>
              Unlock the secrets of your life with India's most trusted astrologer. 
              Get accurate predictions, powerful remedies, and genuine guidance for a prosperous future.
            </p>
            <div className="social-links">
              <a href="#">FB</a>
              <a href="#">IG</a>
              <a href="#">YT</a>
              <a href="#">X</a>
            </div>
          </div>

          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/consultation">Book Consultation</Link></li>
              <li><Link to="/courses">Astrology Courses</Link></li>
              <li><Link to="/calculators">Free Calculators</Link></li>
              <li><Link to="/reports">Detailed Reports</Link></li>
            </ul>
          </div>

          <div className="footer-services">
            <h4>Our Services</h4>
            <ul>
              <li><Link to="/reports">Kundli Matching</Link></li>
              <li><Link to="/reports">Personal Horoscope</Link></li>
              <li><Link to="/reports">Numerology Report</Link></li>
              <li><Link to="/consultation">Online Puja</Link></li>
              <li><Link to="/reports">Vastu Consultation</Link></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>Contact Us</h4>
            <ul>
              <li>
                <Phone size={18} />
                <a href="tel:7414858885">+91 7414858885</a>
              </li>
              <li>
                <Mail size={18} />
                <a href="mailto:info@astrodilipsharma.com">info@astrodilipsharma.com</a>
              </li>
              <li>
                <MapPin size={18} />
                <span>Jaipur, Rajasthan, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Astro Dilip Sharma. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
