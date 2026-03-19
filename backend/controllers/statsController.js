const Amal = require('../models/Amal');

// ✅ helper — manually calculate totalPoints (same logic as reportsController)
const calcTotalPoints = (r) => {
  let pts = 0;
  pts += Math.min(10, r.salat?.fajr || 0);
  pts += Math.min(10, r.salat?.dhuhr || 0);
  pts += Math.min(10, r.salat?.asr || 0);
  pts += Math.min(10, r.salat?.maghrib || 0);
  pts += Math.min(10, r.salat?.isha || 0);
  pts += Math.min(5, r.salat?.tahajjud || 0);
  pts += (r.quran?.pages || 0) > 0 ? 5 : 0;
  pts += r.siyam?.foroj ? 10 : 0;
  pts += r.siyam?.nofol ? 5 : 0;
  pts += r.generalRule || 0;
  return Math.round(pts * 100) / 100;
};

exports.getDashboard = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const userId = req.user._id;

    const rawRecords = await Amal.find({
      user: userId,
      date: {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31, 23, 59, 59),
      },
    }).lean({ virtuals: true });

    // ✅ Attach computed totalPoints to every record
    const records = rawRecords.map((r) => ({
      ...r,
      totalPoints: calcTotalPoints(r),
    }));

    // Monthly breakdown
    const monthly = Array.from({ length: 12 }, (_, i) => {
      const mr = records.filter((r) => new Date(r.date).getMonth() === i);
      const totalPoints = mr.reduce((s, r) => s + r.totalPoints, 0);
      return {
        month: i + 1,
        days: mr.length,
        totalPoints,
        avgPoints: mr.length ? Math.round(totalPoints / mr.length) : 0,
        quranPages: mr.reduce((s, r) => s + (r.quran?.pages || 0), 0),
        fastDays: mr.filter((r) => r.siyam?.foroj).length,
        exerciseMinutes: mr.reduce((s, r) => s + (r.exercise?.minutes || 0), 0),
        // ✅ Salat total for chart
        salatTotal: mr.reduce(
          (s, r) =>
            s +
            (r.salat?.fajr || 0) +
            (r.salat?.dhuhr || 0) +
            (r.salat?.asr || 0) +
            (r.salat?.maghrib || 0) +
            (r.salat?.isha || 0) +
            (r.salat?.tahajjud || 0),
          0,
        ),
      };
    });

    // Streak calculation
    const sorted = [...records].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    for (const r of sorted) {
      const d = new Date(r.date);
      d.setHours(0, 0, 0, 0);
      const diff = Math.round((checkDate - d) / 86400000);
      if (diff <= 1) {
        streak++;
        checkDate = d;
      } else break;
    }

    // Summary totals
    const totals = {
      days: records.length,
      totalPoints: records.reduce((s, r) => s + r.totalPoints, 0),
      quranPages: records.reduce((s, r) => s + (r.quran?.pages || 0), 0),
      fastDays: records.filter((r) => r.siyam?.foroj).length,
      exerciseMinutes: records.reduce(
        (s, r) => s + (r.exercise?.minutes || 0),
        0,
      ),
      avgSleep: records.length
        ? (
            records.reduce((s, r) => s + (r.sleep?.hours || 0), 0) /
            records.length
          ).toFixed(1)
        : 0,
      streak,
    };

    const recent = sorted.slice(0, 7);

    res.json({ monthly, totals, recent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
