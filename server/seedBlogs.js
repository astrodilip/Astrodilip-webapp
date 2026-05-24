import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Blog from './models/Blog.js';

dotenv.config({ path: './.env' });

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/astrology').then(async () => {
  const count = await Blog.countDocuments();
  if (count === 0) {
    await Blog.insertMany([
      {
        title: "Understanding Planetary Transits in 2026",
        excerpt: "Astro Dilip Sharma explains how the major transits of Saturn and Jupiter will impact your sun sign this year...",
        date: "May 15, 2026",
        author: "Astro Dilip Sharma",
        image: "/courses/new-planetary transits.png"
      },
      {
        title: "How Vastu Changed My Business",
        excerpt: "After struggling for years, applying simple Vastu remedies suggested by Astro Dilip transformed my workspace energy...",
        date: "May 10, 2026",
        author: "Priya M. (Client Experience)",
        image: "/courses/new-vastu.png"
      },
      {
        title: "The Power of Lal Kitab Remedies",
        excerpt: "Why Lal Kitab is considered one of the most practical and effective branches of astrology in the modern era.",
        date: "May 2, 2026",
        author: "Astro Dilip Sharma",
        image: "/courses/new-lalkitab.jpg"
      }
    ]);
    console.log("Seeded blogs successfully.");
  } else {
    console.log("Blogs already exist.");
  }
  process.exit(0);
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
