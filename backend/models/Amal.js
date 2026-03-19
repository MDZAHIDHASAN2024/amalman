const mongoose = require('mongoose');

const amalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },

  // Salat (each 0-10 points or boolean)
  salat: {
    fajr:   { type: Number, default: 0, min: 0, max: 10 }, // M
    dhuhr:  { type: Number, default: 0, min: 0, max: 10 }, // E (Johr)
    asr:    { type: Number, default: 0, min: 0, max: 10 }, // F
    maghrib:{ type: Number, default: 0, min: 0, max: 10 }, // J
    isha:   { type: Number, default: 0, min: 0, max: 10 }, // A
    tahajjud:{ type: Number, default: 0, min: 0, max: 5 }, // T
  },

  // Quran
  quran: {
    pages: { type: Number, default: 0 },
    juz:   { type: Number, default: 0 },
  },

  // Siyam (fasting)
  siyam: {
    foroj: { type: Boolean, default: false }, // Fard fast
    nofol: { type: Boolean, default: false }, // Nafl fast
  },

  // Prayer / Dua
  prayer: {
    morning:   { type: Number, default: 0 }, // Morning azkar (points)
    tawba100:  { type: Boolean, default: false }, // 100x Astaghfirullah
    evening:   { type: Number, default: 0 }, // Evening azkar (points)
  },

  // General Rule (custom points)
  generalRule: { type: Number, default: 0 },

  // Exercise
  exercise: {
    minutes: { type: Number, default: 0 },
  },

  // Sleep
  sleep: {
    hours: { type: Number, default: 0 },
  },

  // Extra ibadah — morning/evening dua & daily tawba
  extra: {
    sokalDua:   { type: Boolean, default: false }, // Morning dua (সকালের দোয়া)
    dinerTowba: { type: Boolean, default: false }, // Day tawba (দিনের তওবা)
    sondharDua: { type: Boolean, default: false }, // Evening dua (সন্ধ্যার দোয়া)
  },

  remarks: { type: String, default: '' },
}, { timestamps: true });

// Auto-calculate total points (MAX = 75)
// Salat: fajr/dhuhr/asr/maghrib/isha max 10 each = 50, tahajjud max 5 = 55 total
// Quran: max 10 pages × 0.5 = 5 pts
// Siyam: foroj = 10, nofol = 5
// generalRule: custom
amalSchema.virtual('totalPoints').get(function () {
  let pts = 0;
  const s = this.salat || {};
  pts += Math.min(10, s.fajr    || 0);
  pts += Math.min(10, s.dhuhr   || 0);
  pts += Math.min(10, s.asr     || 0);
  pts += Math.min(10, s.maghrib || 0);
  pts += Math.min(10, s.isha    || 0);
  pts += Math.min(5,  s.tahajjud|| 0);
  const pages = Math.min(10, this.quran?.pages || 0);
  pts += pages > 0 ? 5 : 0; // যেকোনো পাতা = flat 5 pts
  pts += this.siyam?.foroj ? 10 : 0;
  pts += this.siyam?.nofol ? 5  : 0;
  pts += (this.generalRule || 0);
  return Math.round(pts * 10) / 10;
});

amalSchema.set('toJSON', { virtuals: true });
amalSchema.set('toObject', { virtuals: true });

// Unique date per user
amalSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Amal', amalSchema);
