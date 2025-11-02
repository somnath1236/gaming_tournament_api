const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');

/**
 * GET /users/me/wallet/balance
 * Get user wallet balance
 */
router.get('/balance', authenticateUser, async (req, res) => {
  res.json({
    success: true,
    data: {
      coinsBalance: parseFloat(req.user.coins_balance),
      cashBalance: parseFloat(req.user.cash_balance),
      pendingWithdrawals: parseFloat(req.user.pending_withdrawals)
    }
  });
});

module.exports = router;

