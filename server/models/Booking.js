import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  userEmail: { type: String },
  date: { type: String },
  timeSlot: { type: String },
  duration: { type: Number },
  consultationType: { type: String }, // 'chat', 'audio', 'video'
  status: { type: String, default: 'pending' }, // 'pending', 'confirmed', 'completed', 'cancelled'
  amount: { type: Number },
  paymentStatus: { type: String, default: 'pending' }, // 'pending', 'paid'
  createdAt: { type: Date, default: Date.now },
  notes: { type: String }
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
