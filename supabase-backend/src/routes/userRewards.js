const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { validateQuery, paginationSchema } = require('../utils/validators');

/**
 * GET /users/me/rewards
 * Get user's redemptions
 */
router.get('/', authenticateUser, validateQuery(paginationSchema), async (req, res) => {
  try {
    let query = supabase
      .from('redemptions')
      .select('*')
      .eq('user_id', req.user.id);
    
    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data: redemptions } = await query.range(from, to);
    
    res.json({
      success: true,
      data: {
        redemptions: redemptions || [],
        pagination: {
          page,
          limit,
          total: redemptions?.length || 0,
          totalPages: Math.ceil((redemptions?.length || 0) / limit)
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

module.exports = router;

