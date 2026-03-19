const User = require('../models/User');
const Amal = require('../models/Amal');
const GeneralRule = require('../models/GeneralRule');
const UserRule = require('../models/UserRule');

// GET all users (admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 }).lean();
    const totalUsers = users.length;
    const activeUsers = users.filter(u => !u.banned).length;
    const bannedUsers = users.filter(u => u.banned).length;
    const adminCount = users.filter(u => u.isAdmin).length;
    res.json({ users, stats: { totalUsers, activeUsers, bannedUsers, adminCount } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PATCH ban/unban user
exports.updateUser = async (req, res) => {
  try {
    const { banned, isAdmin } = req.body;
    const update = {};
    if (typeof banned === 'boolean') update.banned = banned;
    if (typeof isAdmin === 'boolean') update.isAdmin = isAdmin;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE user + ALL their data
exports.deleteUser = async (req, res) => {
  try {
    const uid = req.params.id;
    // Delete all user data in parallel
    await Promise.all([
      User.findByIdAndDelete(uid),
      Amal.deleteMany({ user: uid }),
      GeneralRule.deleteMany({ user: uid }),
      UserRule.deleteMany({ user: uid }),
    ]);
    res.json({ message: 'User and all data deleted successfully.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
