const mongoose = require('mongoose');

const generalRuleSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:    { type: String, required: true, trim: true },
  category:{ type: String, default: 'সাধারণ' },
  order:   { type: Number, default: 0 },
}, { timestamps: true });

generalRuleSchema.index({ user: 1, order: 1 });

module.exports = mongoose.model('GeneralRule', generalRuleSchema);
