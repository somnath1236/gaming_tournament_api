const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

/**
 * GET /users/me
 * Get current user profile
 */
router.get('/', authenticateUser, async (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      email: req.user.email,
      phoneNumber: req.user.phone_number,
      fullName: req.user.full_name,
      inGameName: req.user.in_game_name,
      primaryGame: req.user.primary_game,
      profilePicture: req.user.profile_picture,
      coinsBalance: parseFloat(req.user.coins_balance),
      cashBalance: parseFloat(req.user.cash_balance),
      kycVerified: req.user.kyc_verified,
      status: req.user.status
    }
  });
});

/**
 * PUT /users/me
 * Update user profile
 */
router.put('/', authenticateUser, async (req, res) => {
  try {
    const updates = {};
    const allowedFields = ['full_name', 'in_game_name', 'primary_game', 'profile_picture', 'phone_number'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_UPDATES', message: 'No valid fields to update' }
      });
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: 'Failed to update profile' }
      });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

module.exports = router;

