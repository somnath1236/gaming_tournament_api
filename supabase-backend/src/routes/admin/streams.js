const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../../middleware/auth');

router.get('/', authenticateAdmin, (req, res) => {
  res.json({ success: true, data: { streams: [] } });
});

router.post('/:id/feature', authenticateAdmin, (req, res) => {
  res.json({ success: true, message: 'Stream featured successfully' });
});

module.exports = router;

