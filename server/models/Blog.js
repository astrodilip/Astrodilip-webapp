import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  excerpt: { type: String, required: true },
  date: { type: String, required: true },
  author: { type: String, required: true },
  image: { type: String, required: true },
  status: { type: String, default: 'published' },
  createdAt: { type: Date, default: Date.now }
});

const Blog = mongoose.model('Blog', blogSchema);
export default Blog;
