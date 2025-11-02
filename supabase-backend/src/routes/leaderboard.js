const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

/**
 * GET /leaderboard
 * Get leaderboard
 */
router.get('/', async (req, res) => {
  try {
    // Get top users by total coins won/earned
    const { data: topUsers, error } = await supabase
      .from('users')
      .select('id, full_name, in_game_name, coins_balance, cash_balance, created_at')
      .order('coins_balance', { ascending: false })
      .limit(100);
    
    if (error) {
      throw error;
    }
    
    // Get top 3
    const top3 = (topUsers || []).slice(0, 3).map((user, index) => ({
      rank: index + 1,
      user: {
        id: user.id,
        name: user.in_game_name,
        coins: parseFloat(user.coins_balance),
        cash: parseFloat(user.cash_balance)
      }
    }));
    
    // Get all entries
    const entries = (topUsers || []).slice(3, 100).map((user, index) => ({
      rank: index + 4,
      user: {
        id: user.id,
        name: user.in_game_name,
        coins: parseFloat(user.coins_balance),
        cash: parseFloat(user.cash_balance)
      }
    }));
    
    res.json({
      success: true,
      data: {
        top3,
        entries,
        userPosition: null // Will be calculated if authenticated
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

module.exports = router;

