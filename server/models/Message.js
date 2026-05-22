import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  senderName: { type: String },
  text: { type: String },
  file: {
    name: String,
    size: Number,
    type: String,
    dataUrl: String
  },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
