const Amal = require('../models/Amal');

// GET all with filters
exports.getAll = async (req, res) => {
  try {
    const { month, year, startDate, endDate, page = 1, limit = 31 } = req.query;
    const filter = { user: req.user._id };

    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate + 'T23:59:59') };
    } else if (month && year) {
      filter.date = { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0, 23, 59, 59) };
    } else if (year) {
      filter.date = { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31, 23, 59, 59) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [records, total] = await Promise.all([
      Amal.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)).lean({ virtuals: true }),
      Amal.countDocuments(filter),
    ]);
    res.json({ records, total, pages: Math.ceil(total / parseInt(limit)), page: parseInt(page) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET single by date
exports.getByDate = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const next = new Date(date); next.setDate(next.getDate() + 1);
    const record = await Amal.findOne({ user: req.user._id, date: { $gte: date, $lt: next } }).lean({ virtuals: true });
    res.json(record || null);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST — create only, same date blocked (409)
exports.upsert = async (req, res) => {
  try {
    const dateStr = req.body.date;
    const date = new Date(dateStr);
    const next = new Date(date); next.setDate(next.getDate() + 1);

    const existing = await Amal.findOne({ user: req.user._id, date: { $gte: date, $lt: next } });
    if (existing) {
      return res.status(409).json({ message: 'এই তারিখে আমল আগেই সংরক্ষিত আছে। History থেকে দেখুন।' });
    }

    const record = await Amal.create({ ...req.body, user: req.user._id, date });
    res.json(record.toJSON());
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT by ID — History edit only
exports.updateById = async (req, res) => {
  try {
    const record = await Amal.findOne({ _id: req.params.id, user: req.user._id });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    Object.assign(record, { ...req.body, user: req.user._id });
    await record.save();
    res.json(record.toJSON());
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE
exports.remove = async (req, res) => {
  try {
    await Amal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
