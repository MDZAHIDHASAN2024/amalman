const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Amal = require('../models/Amal');
const GeneralRule = require('../models/GeneralRule');
const UserRule = require('../models/UserRule');
const User = require('../models/User');

// ── GET export all data as JSON ──────────────────────────────────────────────
router.get('/export', protect, async (req, res) => {
  try {
    const [amals, rules, statuses] = await Promise.all([
      Amal.find({ user: req.user._id }).lean(),
      GeneralRule.find({ user: req.user._id }).lean(),
      UserRule.find({ user: req.user._id }).lean(),
    ]);
    const user = await User.findById(req.user._id).select('-password').lean();
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      user: { name: user.name, email: user.email },
      amals,
      rules,
      ruleStatuses: statuses,
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="myamal_export_${Date.now()}.json"`,
    );
    res.json(exportData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST import data from JSON ────────────────────────────────────────────────
router.post('/import', protect, async (req, res) => {
  try {
    const { amals, rules } = req.body;
    let imported = { amals: 0, rules: 0 };

    // ── Import Amals ──
    if (Array.isArray(amals) && amals.length > 0) {
      for (const a of amals) {
        // ✅ Strip MongoDB-specific fields to avoid conflict
        const { _id, __v, user, id, ...amalData } = a;

        // ✅ Normalize date: use just the date string (YYYY-MM-DD) for comparison
        let dateStr = amalData.date;
        if (!dateStr) continue;

        // Handle both ISO string and date-only string
        const dateOnly =
          typeof dateStr === 'string'
            ? dateStr.slice(0, 10)
            : new Date(dateStr).toISOString().slice(0, 10);

        // ✅ Check duplicate by date string prefix (avoids timezone issues)
        const exists = await Amal.findOne({
          user: req.user._id,
          date: {
            $gte: new Date(dateOnly + 'T00:00:00.000Z'),
            $lt: new Date(dateOnly + 'T23:59:59.999Z'),
          },
        });

        if (!exists) {
          await Amal.create({
            ...amalData,
            date: new Date(dateOnly + 'T06:00:00.000Z'), // ✅ noon UTC to avoid timezone shift
            user: req.user._id,
          });
          imported.amals++;
        }
      }
    }

    // ── Import General Rules ──
    if (Array.isArray(rules) && rules.length > 0) {
      const currentCount = await GeneralRule.countDocuments({
        user: req.user._id,
      });
      const canAdd = Math.max(0, 100 - currentCount);
      const toAdd = rules.slice(0, canAdd);

      for (let i = 0; i < toAdd.length; i++) {
        // ✅ Strip MongoDB-specific fields
        const { _id, __v, user, id, ...ruleData } = toAdd[i];
        await GeneralRule.create({
          ...ruleData,
          user: req.user._id,
          order: currentCount + i,
        });
        imported.rules++;
      }
    }

    res.json({ message: 'Import সম্পন্ন।', imported });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE my data (account থাকবে, শুধু data মুছবে) ──────────────────────────
router.delete('/my-data', protect, async (req, res) => {
  try {
    const uid = req.user._id;
    await Promise.all([
      Amal.deleteMany({ user: uid }),
      GeneralRule.deleteMany({ user: uid }),
      UserRule.deleteMany({ user: uid }),
    ]);
    res.json({ message: 'All data deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
