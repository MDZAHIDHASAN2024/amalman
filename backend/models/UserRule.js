const mongoose = require('mongoose');

// Per-user rule status tracking (completed/pending/incompleted)
const userRuleSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rule:   { type: mongoose.Schema.Types.ObjectId, ref: 'GeneralRule', required: true },
  status: { type: String, enum: ['completed', 'pending', 'incompleted'], default: 'pending' },
}, { timestamps: true });

userRuleSchema.index({ user: 1, rule: 1 }, { unique: true });

module.exports = mongoose.model('UserRule', userRuleSchema);
