const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../../middleware/auth');

router.get('/dashboard', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 0,
      totalTournaments: 0,
      totalRevenue: 0,
      activeStreams: 0
    }
  });
});

router.get('/reports', authenticateAdmin, (req, res) => {
  res.json({ success: true, data: { reports: [] } });
});

module.exports = router;

