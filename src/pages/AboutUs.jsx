import React from 'react';
import './Policies.css';

const AboutUs = () => {
  return (
    <div className="policy-page">
      <div className="policy-header">
        <h1>About Us</h1>
        <p className="last-updated">Last updated: May 2026</p>
      </div>
      <div className="policy-content">
        <p>Myself Mr.Dilip Sharma, I have been practicing on Astrology and Vastu from over 22 years in the field of Vedic Astrology. I gained my knowledge in astrology from some best  professors’of  Rastriya Sanskrit Sansthan. I started my astrological career in the year 2008 and later I also learned the greatest provenance of astrology under the guidance of some great astrologers of Delhi. From 2011 I started practicing in Vastu shastra &amp; Numerology from 2013 so after that continuing working in all way of astrology and it’s uses as required ……”Any Astrologer can tell to someone about his past events &amp; the problems of his life by just see his birth chart” but it is very difficult to provide them accurate remedies. A person will  satisfy only if an astrologer provides them accurate remedies for their problems. if he got best solution for his problems he do not want more about his prediction only, I have studied and practiced since 22yrs on best remedies of Janm kundalies  Grah &amp; Dosh also Provided solutions to more then 50- lakhs clients with chart planet’s positions &amp; Vastu remedies which gives instant &amp; good result to clients, so I give most prefer on Karmic Remedies which give fast &amp; accurate results first I check chart &amp; ask some questions before giving remedies so first I checked all prospectus by Chart, Vaastu and Numerology related issues then only give best and easy solutions. Since last 12 years I have very good work in many astrology app also like 6 years in Astrotalk before that 4 years in astroyogi, Monkvyasa &amp; now recently in Astrosage also but as they serving only business oriented astrology so here I focused more on solutions first &amp; can take challenges for solve issues</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2.5rem' }}>
          <div style={{ background: 'rgba(26, 20, 0, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ color: 'var(--primary)', marginTop: 0, marginBottom: '10px' }}>Vision</h3>
            <p style={{ marginBottom: 0 }}>To empower everyone with authentic Vedic wisdom for achieving their life’s true potential and solving real-life challenges.</p>
          </div>
          
          <div style={{ background: 'rgba(26, 20, 0, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ color: 'var(--primary)', marginTop: 0, marginBottom: '10px' }}>Mission</h3>
            <p style={{ marginBottom: 0 }}>To solve problems and enable growth with accurate, practical, ethical, and reliable astrology all way and with easy solutions.</p>
          </div>
          
          <div style={{ background: 'rgba(26, 20, 0, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ color: 'var(--primary)', marginTop: 0, marginBottom: '10px' }}>Challenges</h3>
            <p style={{ marginBottom: 0 }}>To learning never end so for improve more Knowledge I always accept challenges if someone facing issue long-time &amp; not get resolved by many astrologers I definitely give solutions any way by deeply study in all aspect I have many experiences like theses in my astrology career.</p>
          </div>
        </div>
        
        <h2 style={{ marginTop: '3rem' }}>Contact Information</h2>
        <div style={{ marginTop: '1.5rem', background: 'rgba(26, 20, 0, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <p style={{ marginBottom: '0.5rem' }}><strong>Phone:</strong> +91 7414858885</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Email:</strong> info@astrodilipsharma.com</p>
          <p><strong>Address:</strong> Jaipur, Rajasthan, India</p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
