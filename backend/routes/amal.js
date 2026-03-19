const express = require('express');
const router = express.Router();
const { getAll, getByDate, upsert, updateById, remove } = require('../controllers/amalController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAll);
router.get('/date/:date', protect, getByDate);
router.post('/', protect, upsert);           // create only — same date blocked
router.put('/:id', protect, updateById);     // History edit by ID
router.delete('/:id', protect, remove);

module.exports = router;
