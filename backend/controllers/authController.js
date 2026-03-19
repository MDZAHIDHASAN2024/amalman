const jwt = require('jsonwebtoken');
const User = require('../models/User');

const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'সব ফিল্ড পূরণ করুন' });
    if (password.length < 6) return res.status(400).json({ message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে' });
    if (await User.findOne({ email })) return res.status(400).json({ message: 'এই ইমেইল আগেই নিবন্ধিত' });
    const user = await User.create({ name, email, password });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, token: genToken(user._id) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'ইমেইল ও পাসওয়ার্ড দিন' });
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'ইমেইল বা পাসওয়ার্ড ভুল' });
    if (user.banned) return res.status(403).json({ message: 'অ্যাকাউন্ট ব্যান করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।' });
    res.json({ _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, preferences: user.preferences, token: genToken(user._id) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMe = async (req, res) => {
  res.json(req.user);
};
