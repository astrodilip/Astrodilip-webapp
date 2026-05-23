import React from 'react';
import './Policies.css';

const RefundPolicy = () => {
  return (
    <div className="policy-page">
      <div className="policy-header">
        <h1>Refund and Cancellation Policy</h1>
        <p className="last-updated">Last updated: May 2026</p>
      </div>
      <div className="policy-content">
        <h2>General Cancellation Terms</h2>
        <p>
          At Astro Dilip Sharma, we strive to provide the most accurate and insightful astrological consultations. 
          If you need to cancel or reschedule your booked consultation, please do so at least 24 hours before the scheduled time. 
          Cancellations made within 24 hours of the scheduled time may not be eligible for a refund.
        </p>

        <h2>Consultation Refunds</h2>
        <p>
          Refunds for consultations (voice call, video call, or chat) will only be processed if the cancellation is made 
          at least 24 hours prior to the appointment. If the astrologer is unavailable due to an emergency, we will either 
          reschedule your appointment at your convenience or provide a full refund.
        </p>

        <h2>Digital Reports and Services</h2>
        <p>
          Because of the personalized nature of our digital astrology reports, kundli generation, and numerology reports, 
          we do not offer refunds once the service has been delivered or the report has been generated and sent to you.
        </p>

        <h2>Failed Transactions</h2>
        <p>
          In the event of a failed transaction where the amount has been deducted from your account but the booking 
          was not confirmed, the amount will automatically be refunded to your original method of payment within 
          5-7 business days, depending on your bank's processing time.
        </p>

        <h2>How to Request a Refund</h2>
        <p>
          To request a cancellation or refund, please contact our support team immediately at <strong>support@astrodilipsharma.com</strong> 
          or call us at <strong>+91 7414858885</strong> with your booking details. We will review your request and process 
          eligible refunds within 7-10 business days.
        </p>
      </div>
    </div>
  );
};

export default RefundPolicy;
