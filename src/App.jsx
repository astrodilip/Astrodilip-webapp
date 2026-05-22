import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Consultation from './pages/Consultation';
import Reports from './pages/Reports';
import Courses from './pages/Courses';
import FreeCalculators from './pages/FreeCalculators';
import Contact from './pages/Contact';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Booking from './pages/Booking';
import MyBookings from './pages/MyBookings';

function App() {
  return (
    <Router>
      <div className="page-wrapper">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/consultation" element={<Consultation />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/calculators" element={<FreeCalculators />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/my-bookings" element={<MyBookings />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
