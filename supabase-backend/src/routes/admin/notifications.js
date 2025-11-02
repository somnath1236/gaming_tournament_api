const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../../middleware/auth');

router.post('/send', authenticateAdmin, (req, res) => {
  res.json({ success: true, message: 'Notification sent successfully' });
});

module.exports = router;

