import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: false },
  birthDate: { type: String, required: false },
  birthTime: { type: String, required: false },
  birthPlace: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  role: { type: String, default: 'client' }
});

const User = mongoose.model('User', userSchema);
export default User;
