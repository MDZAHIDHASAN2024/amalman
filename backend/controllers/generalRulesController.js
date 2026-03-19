const User = require('../models/User');

const toObj = (map) => {
  const obj = {};
  if (map) map.forEach((val, key) => { obj[key] = val; });
  return obj;
};

// GET - return user's general rules status + lastResetDate
exports.getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('generalRulesStatus generalRulesResetDate');
    res.json({
      statuses: toObj(user.generalRulesStatus),
      lastResetDate: user.generalRulesResetDate || null,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT - update a single rule status
exports.setStatus = async (req, res) => {
  try {
    const { index, status } = req.body;
    if (index === undefined) return res.status(400).json({ message: 'index required' });
    const user = await User.findById(req.user._id);
    if (!user.generalRulesStatus) user.generalRulesStatus = new Map();
    if (status === null || status === undefined) {
      user.generalRulesStatus.delete(String(index));
    } else {
      user.generalRulesStatus.set(String(index), status);
    }
    user.markModified('generalRulesStatus');
    await user.save();
    res.json({ statuses: toObj(user.generalRulesStatus), lastResetDate: user.generalRulesResetDate || null });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE - reset all statuses, record reset date
exports.resetAll = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    await User.findByIdAndUpdate(req.user._id, {
      generalRulesStatus: new Map(),
      generalRulesResetDate: today,
    });
    res.json({ statuses: {}, lastResetDate: today });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
