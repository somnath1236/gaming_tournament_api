const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { validateQuery, paginationSchema } = require('../utils/validators');

/**
 * GET /rewards/store
 * Get reward store
 */
router.get('/store', validateQuery(paginationSchema), async (req, res) => {
  try {
    let query = supabase
      .from('rewards')
      .select('*')
      .neq('stock_status', 'outOfStock');
    
    if (req.query.category) {
      query = query.eq('category', req.query.category);
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data: rewards } = await query.range(from, to);
    
    res.json({
      success: true,
      data: {
        rewards: rewards || [],
        pagination: {
          page,
          limit,
          total: rewards?.length || 0,
          totalPages: Math.ceil((rewards?.length || 0) / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * POST /rewards/:id/redeem
 * Redeem a reward
 */
router.post('/:id/redeem', authenticateUser, async (req, res) => {
  try {
    const { delivery_details } = req.body;
    
    const { data: reward, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error || !reward) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Reward not found' }
      });
    }
    
    if (reward.stock_status === 'outOfStock') {
      return res.status(422).json({
        success: false,
        error: { code: 'OUT_OF_STOCK', message: 'Reward is out of stock' }
      });
    }
    
    if (req.user.coins_balance < reward.coins_required) {
      return res.status(422).json({
        success: false,
        error: { code: 'INSUFFICIENT_COINS', message: 'Insufficient coins' }
      });
    }
    
    // Check stock quantity
    if (reward.stock_quantity !== null && reward.stock_quantity <= 0) {
      return res.status(422).json({
        success: false,
        error: { code: 'OUT_OF_STOCK', message: 'Reward is out of stock' }
      });
    }
    
    // Deduct coins
    const { data: currentUser } = await supabase.from('users').select('coins_balance').eq('id', req.user.id).single();
    if (currentUser) {
      await supabase
        .from('users')
        .update({ coins_balance: (parseFloat(currentUser.coins_balance) || 0) - parseFloat(reward.coins_required) })
        .eq('id', req.user.id);
    }
    
    // Update stock if tracked
    if (reward.stock_quantity !== null) {
      const newStock = reward.stock_quantity - 1;
      await supabase
        .from('rewards')
        .update({
          stock_quantity: newStock,
          stock_status: newStock === 0 ? 'outOfStock' : reward.stock_status
        })
        .eq('id', reward.id);
    }
    
    // Create redemption
    const { data: redemption, error: redError } = await supabase
      .from('redemptions')
      .insert({
        reward_id: reward.id,
        user_id: req.user.id,
        reward_name: reward.name,
        coins_deducted: reward.coins_required,
        status: 'pending',
        delivery_details
      })
      .select()
      .single();
    
    if (redError) {
      return res.status(500).json({
        success: false,
        error: { code: 'REDEMPTION_FAILED', message: 'Failed to process redemption' }
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Reward redeemed successfully',
      data: redemption
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

module.exports = router;

