const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../../middleware/auth');

router.post('/reset', authenticateAdmin, (req, res) => {
  res.json({ success: true, message: 'Leaderboard reset successfully' });
});

module.exports = router;

