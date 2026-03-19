const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET is not set in .env file!');
  process.exit(1);
}

// ✅ আগে app তৈরি করুন
const app = express();

// ✅ cors শুধু একবার, সঠিক origin দিয়ে
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://amalman.vercel.app'],
    credentials: true,
  }),
);

app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/amal', require('./routes/amal'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/general-rules', require('./routes/generalRules'));
app.use('/api/settings', require('./routes/settings'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ✅ MongoDB connect হওয়ার পরেই server চালু
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/islamic-tracker')
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });
