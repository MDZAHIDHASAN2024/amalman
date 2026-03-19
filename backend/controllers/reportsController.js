const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Amal = require('../models/Amal');

// ─── helpers ────────────────────────────────────────────────────────────────
const getRecords = async (userId, query) => {
  const { month, year, startDate, endDate } = query;
  const filter = { user: userId };
  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate + 'T23:59:59'),
    };
  } else if (month && year) {
    filter.date = {
      $gte: new Date(year, month - 1, 1),
      $lte: new Date(year, month, 0, 23, 59, 59),
    };
  } else if (year) {
    filter.date = {
      $gte: new Date(year, 0, 1),
      $lte: new Date(year, 11, 31, 23, 59, 59),
    };
  }
  return Amal.find(filter).sort({ date: 1 }).lean({ virtuals: true });
};

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

const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB');
const bool = (v) => (v ? '✓' : '–');
const num = (v) => v || 0;

// ─── EXCEL EXPORT ────────────────────────────────────────────────────────────
exports.exportExcel = async (req, res) => {
  try {
    const rawRecords = await getRecords(req.user._id, req.query);
    const records = rawRecords.map((r) => ({
      ...r,
      totalPoints: calcTotalPoints(r),
    }));

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Islamic Amal Tracker';

    const ws = wb.addWorksheet('আমল রেকর্ড', {
      views: [{ state: 'frozen', ySplit: 2 }],
    });

    const DARK = 'FF1B4332';
    const MID = 'FF2D6A4F';
    const LIGHT = 'FF40916C';
    const WHITE = 'FFFFFFFF';
    const GOLD = 'FFC9A84C';

    // ✅ No wrapText in the general center alignment
    const ctr = { horizontal: 'center', vertical: 'middle', wrapText: false };
    const hFont = (sz = 9) => ({
      bold: true,
      color: { argb: WHITE },
      size: sz,
    });

    const applyHeader = (cell, bg = DARK) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.font = hFont();
      cell.alignment = ctr;
    };

    // Row 1: group titles
    const groups = [
      { range: 'A1:B1', label: 'তারিখ / DATE', bg: DARK },
      { range: 'C1:H1', label: '🕌 SALAT / নামাজ', bg: MID },
      { range: 'I1:I1', label: '📖 QURAN', bg: DARK },
      { range: 'J1:K1', label: '🌙 SIYAM / রোযা', bg: MID },
      { range: 'L1:N1', label: '✨ EXTRA IBADAH', bg: LIGHT },
      { range: 'O1:O1', label: '⭐ GEN RULE', bg: DARK },
      { range: 'P1:P1', label: '🏃 EXERCISE', bg: MID },
      { range: 'Q1:Q1', label: '😴 SLEEP', bg: DARK },
      { range: 'R1:R1', label: '📊 TOTAL PTS', bg: GOLD },
      { range: 'S1:S1', label: '📝 REMARKS', bg: DARK },
    ];
    groups.forEach((g) => {
      if (g.range.includes(':')) ws.mergeCells(g.range);
      const cell = ws.getCell(g.range.split(':')[0]);
      cell.value = g.label;
      applyHeader(cell, g.bg);
    });
    ws.getRow(1).height = 24;

    // Row 2: sub-headers
    const sub = [
      '#',
      'তারিখ',
      'ফজর',
      'যোহর',
      'আসর',
      'মাগরিব',
      'ইশা',
      'তাহাজ্জুদ',
      'পাতা (Pages)',
      'ফরজ রোযা',
      'নফল রোযা',
      'সকালের দোয়া',
      'দিনের তওবা',
      'সন্ধ্যার দোয়া',
      'জেনারেল পয়েন্ট',
      'ব্যায়াম (মিনিট)',
      'ঘুম (ঘণ্টা)',
      'মোট পয়েন্ট',
      'মন্তব্য',
    ];
    const subRow = ws.getRow(2);
    sub.forEach((h, i) => {
      const cell = subRow.getCell(i + 1);
      cell.value = h;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MID } };
      cell.font = hFont(8);
      cell.alignment = ctr;
    });
    ws.getRow(2).height = 22;

    // Column widths
    const widths = [
      4, 11, 7, 7, 7, 7, 7, 9, 9, 8, 8, 11, 10, 11, 13, 13, 11, 12, 40,
    ];
    widths.forEach((w, i) => {
      ws.getColumn(i + 1).width = w;
    });

    const GREEN_H = 'FF95D5B2';
    const YELLOW = 'FFFFD166';
    const RED_H = 'FFFF8C8C';
    const STRIPE = 'FFF4F7F5';

    records.forEach((r, idx) => {
      const pts = r.totalPoints;
      const row = ws.addRow([
        idx + 1,
        fmtDate(r.date),
        num(r.salat?.fajr),
        num(r.salat?.dhuhr),
        num(r.salat?.asr),
        num(r.salat?.maghrib),
        num(r.salat?.isha),
        num(r.salat?.tahajjud),
        num(r.quran?.pages),
        bool(r.siyam?.foroj),
        bool(r.siyam?.nofol),
        bool(r.extra?.sokalDua),
        bool(r.extra?.dinerTowba),
        bool(r.extra?.sondharDua),
        num(r.generalRule),
        num(r.exercise?.minutes),
        num(r.sleep?.hours),
        pts,
        r.remarks || '',
      ]);

      const stripe = idx % 2 === 0 ? STRIPE : 'FFFFFFFF';
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = ctr;
        cell.font = { size: 9 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: stripe },
        };
      });

      // ✅ Remarks cell — no wrap, left aligned, single line
      const remCell = row.getCell(19);
      remCell.alignment = {
        horizontal: 'left',
        vertical: 'middle',
        wrapText: false,
      };
      remCell.font = { size: 9 };

      // Points cell color
      const ptCell = row.getCell(18);
      ptCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb:
            pts >= 80 ? GREEN_H : pts >= 50 ? YELLOW : pts > 0 ? RED_H : stripe,
        },
      };
      ptCell.font = { bold: true, size: 9 };

      // Siyam bold
      row.getCell(10).font = {
        bold: true,
        size: 9,
        color: { argb: r.siyam?.foroj ? 'FF2D6A4F' : 'FF999999' },
      };
      row.getCell(11).font = {
        bold: true,
        size: 9,
        color: { argb: r.siyam?.nofol ? 'FFC9A84C' : 'FF999999' },
      };

      // Extra ibadah color
      [12, 13, 14].forEach((c) => {
        const val = row.getCell(c).value;
        row.getCell(c).font = {
          bold: val === '✓',
          size: 9,
          color: { argb: val === '✓' ? 'FF2D6A4F' : 'FF999999' },
        };
      });
    });

    // Summary row
    if (records.length) {
      ws.addRow([]);
      const totPts = records.reduce((s, r) => s + r.totalPoints, 0);
      const avgSleep = (
        records.reduce((s, r) => s + (r.sleep?.hours || 0), 0) / records.length
      ).toFixed(1);

      const sumVals = [
        '',
        'মোট / TOTAL',
        records.reduce((s, r) => s + (r.salat?.fajr || 0), 0),
        records.reduce((s, r) => s + (r.salat?.dhuhr || 0), 0),
        records.reduce((s, r) => s + (r.salat?.asr || 0), 0),
        records.reduce((s, r) => s + (r.salat?.maghrib || 0), 0),
        records.reduce((s, r) => s + (r.salat?.isha || 0), 0),
        records.reduce((s, r) => s + (r.salat?.tahajjud || 0), 0),
        records.reduce((s, r) => s + (r.quran?.pages || 0), 0),
        records.filter((r) => r.siyam?.foroj).length + ' দিন',
        records.filter((r) => r.siyam?.nofol).length + ' দিন',
        records.filter((r) => r.extra?.sokalDua).length + ' দিন',
        records.filter((r) => r.extra?.dinerTowba).length + ' দিন',
        records.filter((r) => r.extra?.sondharDua).length + ' দিন',
        records.reduce((s, r) => s + (r.generalRule || 0), 0),
        records.reduce((s, r) => s + (r.exercise?.minutes || 0), 0),
        avgSleep + ' গড়',
        totPts,
        '',
      ];
      const sumRow = ws.addRow(sumVals);
      sumRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: DARK },
        };
        cell.font = { bold: true, color: { argb: WHITE }, size: 9 };
        cell.alignment = ctr;
      });
      const tpCell = sumRow.getCell(18);
      tpCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: GOLD },
      };
      tpCell.font = { bold: true, color: { argb: 'FF1B4332' }, size: 10 };
    }

    // ── Sheet 2: Summary Statistics ────────────────────────────────────────
    const ws2 = wb.addWorksheet('সারসংক্ষেপ');
    ws2.getColumn(1).width = 30;
    ws2.getColumn(2).width = 20;
    ws2.getColumn(3).width = 20;

    const addStat = (label, value, note = '') => {
      const row = ws2.addRow([label, value, note]);
      row.getCell(1).font = { bold: false, size: 10 };
      row.getCell(2).font = {
        bold: true,
        size: 11,
        color: { argb: 'FF2D6A4F' },
      };
      row.getCell(2).alignment = { horizontal: 'center' };
      row.getCell(3).font = { size: 9, color: { argb: 'FF888888' } };
      row.height = 18;
    };
    const addSection = (title) => {
      ws2.addRow([]);
      const r = ws2.addRow([title]);
      r.getCell(1).font = { bold: true, size: 12, color: { argb: WHITE } };
      r.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: MID },
      };
      ws2.mergeCells(`A${r.number}:C${r.number}`);
      r.height = 22;
    };

    const titleRow = ws2.addRow(['📊 আমল ট্র্যাকার — সারসংক্ষেপ রিপোর্ট']);
    ws2.mergeCells(`A${titleRow.number}:C${titleRow.number}`);
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: DARK } };
    titleRow.getCell(1).alignment = { horizontal: 'center' };
    titleRow.height = 30;
    ws2.addRow([
      'তারিখ',
      new Date().toLocaleDateString('en-GB'),
      `মোট ${records.length} দিনের রেকর্ড`,
    ]);

    if (records.length > 0) {
      const totPts = records.reduce((s, r) => s + r.totalPoints, 0);
      const avgPts = (totPts / records.length).toFixed(1);

      addSection('📊 সামগ্রিক পরিসংখ্যান');
      addStat('মোট দিন রেকর্ড', records.length);
      addStat('মোট পয়েন্ট অর্জিত', totPts);
      addStat('গড় পয়েন্ট (প্রতি দিন)', avgPts);
      addStat(
        'সর্বোচ্চ পয়েন্ট (একদিনে)',
        Math.max(...records.map((r) => r.totalPoints)),
      );
      addStat(
        'সর্বনিম্ন পয়েন্ট (একদিনে)',
        Math.min(...records.map((r) => r.totalPoints)),
      );

      addSection('🕌 নামাজ পরিসংখ্যান');
      addStat(
        'ফজর মোট',
        records.reduce((s, r) => s + (r.salat?.fajr || 0), 0),
        'max 10/day',
      );
      addStat(
        'যোহর মোট',
        records.reduce((s, r) => s + (r.salat?.dhuhr || 0), 0),
        'max 10/day',
      );
      addStat(
        'আসর মোট',
        records.reduce((s, r) => s + (r.salat?.asr || 0), 0),
        'max 10/day',
      );
      addStat(
        'মাগরিব মোট',
        records.reduce((s, r) => s + (r.salat?.maghrib || 0), 0),
        'max 10/day',
      );
      addStat(
        'ইশা মোট',
        records.reduce((s, r) => s + (r.salat?.isha || 0), 0),
        'max 10/day',
      );
      addStat(
        'তাহাজ্জুদ মোট',
        records.reduce((s, r) => s + (r.salat?.tahajjud || 0), 0),
        'max 5/day',
      );

      addSection('📖 কুরআন পরিসংখ্যান');
      addStat(
        'মোট পাতা পঠিত',
        records.reduce((s, r) => s + (r.quran?.pages || 0), 0),
      );
      addStat(
        'কুরআন পড়া দিন',
        records.filter((r) => (r.quran?.pages || 0) > 0).length,
      );

      addSection('🌙 সিয়াম পরিসংখ্যান');
      addStat('ফরজ রোযার দিন', records.filter((r) => r.siyam?.foroj).length);
      addStat('নফল রোযার দিন', records.filter((r) => r.siyam?.nofol).length);

      addSection('✨ অতিরিক্ত ইবাদত');
      addStat(
        'সকালের দোয়া পড়া দিন',
        records.filter((r) => r.extra?.sokalDua).length,
      );
      addStat(
        'দিনের তওবা করা দিন',
        records.filter((r) => r.extra?.dinerTowba).length,
      );
      addStat(
        'সন্ধ্যার দোয়া পড়া দিন',
        records.filter((r) => r.extra?.sondharDua).length,
      );

      addSection('🏃 ব্যায়াম ও ঘুম');
      addStat(
        'মোট ব্যায়াম',
        records.reduce((s, r) => s + (r.exercise?.minutes || 0), 0) + ' মিনিট',
      );
      addStat(
        'লক্ষ্য অর্জিত দিন (৩০+ মিনিট)',
        records.filter((r) => (r.exercise?.minutes || 0) >= 30).length,
      );
      addStat(
        'গড় ঘুম',
        (
          records.reduce((s, r) => s + (r.sleep?.hours || 0), 0) /
          records.length
        ).toFixed(1) + ' ঘণ্টা',
      );

      addSection('⭐ General Rule');
      addStat(
        'মোট General Rule পয়েন্ট',
        records.reduce((s, r) => s + (r.generalRule || 0), 0),
      );
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="amal_report_${Date.now()}.xlsx"`,
    );
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── PDF EXPORT ──────────────────────────────────────────────────────────────
exports.exportPDF = async (req, res) => {
  try {
    const rawRecords = await getRecords(req.user._id, req.query);
    const records = rawRecords.map((r) => ({
      ...r,
      totalPoints: calcTotalPoints(r),
    }));

    const doc = new PDFDocument({
      margin: 28,
      size: 'A4',
      layout: 'landscape',
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="amal_report_${Date.now()}.pdf"`,
    );
    doc.pipe(res);

    const GREEN = '#1B4332';
    const GREEN2 = '#2D6A4F';
    const GREEN3 = '#40916C';
    const GOLD = '#C9A84C';
    const LIGHT = '#F4F7F5';

    // Cover / Title
    doc.rect(0, 0, doc.page.width, 70).fill(GREEN);
    doc
      .fillColor('#fff')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('🕌  Islamic Amal Tracker', 28, 14, { align: 'left' });
    doc
      .fontSize(11)
      .font('Helvetica')
      .text('দৈনিক আমল রিপোর্ট  •  Daily Amal Report', 28, 38);
    doc
      .fontSize(9)
      .text(
        `Generated: ${new Date().toLocaleDateString('en-GB')}   |   Total Records: ${records.length} দিন`,
        28,
        54,
      );
    doc.y = 80;

    // Summary boxes
    if (records.length > 0) {
      const totPts = records.reduce((s, r) => s + r.totalPoints, 0);
      const totPages = records.reduce((s, r) => s + (r.quran?.pages || 0), 0);
      const fastDays = records.filter((r) => r.siyam?.foroj).length;
      const exMin = records.reduce((s, r) => s + (r.exercise?.minutes || 0), 0);
      const avgPts = (totPts / records.length).toFixed(1);
      const sokal = records.filter((r) => r.extra?.sokalDua).length;
      const tawba = records.filter((r) => r.extra?.dinerTowba).length;
      const sondhar = records.filter((r) => r.extra?.sondharDua).length;

      const boxes = [
        {
          label: 'মোট পয়েন্ট',
          value: totPts,
          sub: `গড় ${avgPts}/দিন`,
          color: GREEN,
        },
        {
          label: 'কুরআন পাতা',
          value: totPages,
          sub: 'মোট পঠিত পাতা',
          color: GREEN2,
        },
        { label: 'ফরজ রোযা', value: fastDays, sub: 'মোট দিন', color: GREEN3 },
        { label: 'ব্যায়াম', value: exMin, sub: 'মোট মিনিট', color: GOLD },
        { label: 'সকালের দোয়া', value: sokal, sub: 'দিন', color: GREEN2 },
        { label: 'দিনের তওবা', value: tawba, sub: 'দিন', color: GREEN3 },
        { label: 'সন্ধ্যার দোয়া', value: sondhar, sub: 'দিন', color: GREEN },
      ];

      const bW = 106,
        bH = 48,
        bGap = 6,
        startX = 28;
      let bx = startX;
      const by = doc.y;
      boxes.forEach((b) => {
        doc.rect(bx, by, bW, bH).fill(b.color);
        doc
          .fillColor('#fff')
          .fontSize(8)
          .font('Helvetica')
          .text(b.label, bx + 7, by + 7, { width: bW - 14 });
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text(String(b.value), bx + 7, by + 18, { width: bW - 14 });
        doc
          .fontSize(7)
          .font('Helvetica')
          .text(b.sub, bx + 7, by + 38, { width: bW - 14 });
        bx += bW + bGap;
      });
      doc.y = by + bH + 12;
    }

    // Table
    const cols = [
      { h: '#', w: 22 },
      { h: 'তারিখ', w: 55 },
      { h: 'ফজর', w: 26 },
      { h: 'যোহর', w: 26 },
      { h: 'আসর', w: 26 },
      { h: 'মাগরিব', w: 30 },
      { h: 'ইশা', w: 26 },
      { h: 'তাহাজ্জুদ', w: 34 },
      { h: 'কুরআন\nপাতা', w: 34 },
      { h: 'ফরজ\nরোযা', w: 28 },
      { h: 'নফল\nরোযা', w: 28 },
      { h: 'সকালের\nদোয়া', w: 35 },
      { h: 'দিনের\nতওবা', w: 32 },
      { h: 'সন্ধ্যার\nদোয়া', w: 35 },
      { h: 'Gen\nRule', w: 28 },
      { h: 'ব্যায়াম\n(মি)', w: 34 },
      { h: 'ঘুম\n(ঘণ্টা)', w: 30 },
      { h: 'পয়েন্ট', w: 36 },
    ];
    const totalW = cols.reduce((s, c) => s + c.w, 0);
    const startX = 28;
    let tableY = doc.y;
    const rowH = 15;
    const headH = 24;

    const drawTableHeader = (y) => {
      doc.rect(startX, y, totalW, headH).fill(GREEN);
      let cx = startX;
      cols.forEach((col) => {
        doc
          .fillColor('#fff')
          .fontSize(6.5)
          .font('Helvetica-Bold')
          .text(col.h, cx + 2, y + 3, { width: col.w - 4, align: 'center' });
        cx += col.w;
      });
      return y + headH;
    };

    tableY = drawTableHeader(tableY);

    records.forEach((r, idx) => {
      if (tableY + rowH > doc.page.height - 30) {
        doc.addPage({ margin: 28, layout: 'landscape' });
        tableY = drawTableHeader(28);
      }

      const bg = idx % 2 === 0 ? LIGHT : '#FFFFFF';
      doc.rect(startX, tableY, totalW, rowH).fill(bg);

      const pts = r.totalPoints;
      const ptsBg =
        pts >= 80
          ? '#95D5B2'
          : pts >= 50
            ? '#FFD166'
            : pts > 0
              ? '#FF8C8C'
              : bg;

      const vals = [
        idx + 1,
        fmtDate(r.date),
        num(r.salat?.fajr),
        num(r.salat?.dhuhr),
        num(r.salat?.asr),
        num(r.salat?.maghrib),
        num(r.salat?.isha),
        num(r.salat?.tahajjud),
        num(r.quran?.pages),
        bool(r.siyam?.foroj),
        bool(r.siyam?.nofol),
        bool(r.extra?.sokalDua),
        bool(r.extra?.dinerTowba),
        bool(r.extra?.sondharDua),
        num(r.generalRule),
        num(r.exercise?.minutes),
        num(r.sleep?.hours),
        pts,
      ];

      let cx = startX;
      vals.forEach((v, vi) => {
        const isLast = vi === vals.length - 1;
        if (isLast) doc.rect(cx, tableY, cols[vi].w, rowH).fill(ptsBg);
        const textColor = isLast
          ? '#1B4332'
          : v === '✓'
            ? '#2D6A4F'
            : v === '–'
              ? '#BBBBBB'
              : '#333333';
        doc
          .fillColor(textColor)
          .fontSize(7)
          .font(isLast ? 'Helvetica-Bold' : 'Helvetica')
          .text(String(v), cx + 2, tableY + 4, {
            width: cols[vi].w - 4,
            align: 'center',
          });
        cx += cols[vi].w;
      });

      tableY += rowH;
    });

    // Summary row at end
    if (records.length > 0) {
      if (tableY + rowH + 4 > doc.page.height - 30) {
        doc.addPage({ margin: 28, layout: 'landscape' });
        tableY = 28;
      }
      tableY += 2;
      doc.rect(startX, tableY, totalW, rowH + 2).fill(GREEN);

      const sumVals = [
        '',
        'TOTAL',
        records.reduce((s, r) => s + (r.salat?.fajr || 0), 0),
        records.reduce((s, r) => s + (r.salat?.dhuhr || 0), 0),
        records.reduce((s, r) => s + (r.salat?.asr || 0), 0),
        records.reduce((s, r) => s + (r.salat?.maghrib || 0), 0),
        records.reduce((s, r) => s + (r.salat?.isha || 0), 0),
        records.reduce((s, r) => s + (r.salat?.tahajjud || 0), 0),
        records.reduce((s, r) => s + (r.quran?.pages || 0), 0),
        records.filter((r) => r.siyam?.foroj).length,
        records.filter((r) => r.siyam?.nofol).length,
        records.filter((r) => r.extra?.sokalDua).length,
        records.filter((r) => r.extra?.dinerTowba).length,
        records.filter((r) => r.extra?.sondharDua).length,
        records.reduce((s, r) => s + (r.generalRule || 0), 0),
        records.reduce((s, r) => s + (r.exercise?.minutes || 0), 0),
        (
          records.reduce((s, r) => s + (r.sleep?.hours || 0), 0) /
          records.length
        ).toFixed(1),
        records.reduce((s, r) => s + r.totalPoints, 0),
      ];
      let cx = startX;
      sumVals.forEach((v, vi) => {
        doc
          .fillColor('#fff')
          .fontSize(7)
          .font('Helvetica-Bold')
          .text(String(v), cx + 2, tableY + 5, {
            width: cols[vi].w - 4,
            align: 'center',
          });
        cx += cols[vi].w;
      });

      doc
        .fillColor('#888')
        .fontSize(7)
        .font('Helvetica')
        .text('* মন্তব্য Excel ফাইলে আছে', startX, tableY + rowH + 8);
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
