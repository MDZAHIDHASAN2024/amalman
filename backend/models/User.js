const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  isAdmin:  { type: Boolean, default: false },
  banned:   { type: Boolean, default: false },
  preferences: {
    pageSize: { type: Number, default: 20 },
    theme:    { type: String, default: 'dark' },
  },
  generalRulesStatus:    { type: Map, of: String, default: {} },
  generalRulesResetDate: { type: String, default: null }, // 'YYYY-MM-DD'
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (pass) {
  return bcrypt.compare(pass, this.password);
};

module.exports = mongoose.model('User', userSchema);
