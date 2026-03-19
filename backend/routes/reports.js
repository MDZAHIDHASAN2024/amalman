const express = require('express');
const router = express.Router();
const { exportExcel, exportPDF } = require('../controllers/reportsController');
const { protect } = require('../middleware/auth');
router.get('/excel', protect, exportExcel);
router.get('/pdf', protect, exportPDF);
module.exports = router;
