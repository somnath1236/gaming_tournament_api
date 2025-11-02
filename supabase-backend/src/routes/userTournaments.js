const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { validateQuery, paginationSchema } = require('../utils/validators');

/**
 * GET /users/me/tournaments
 * Get user's registered tournaments
 */
router.get('/', authenticateUser, validateQuery(paginationSchema), async (req, res) => {
  try {
    let query = supabase
      .from('tournament_registrations')
      .select('*, tournament:tournaments(*)')
      .eq('user_id', req.user.id);
    
    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data: registrations } = await query.range(from, to);
    
    res.json({
      success: true,
      data: {
        tournaments: (registrations || []).map(r => ({
          id: r.id,
          tournament: r.tournament,
          status: r.status
        })),
        pagination: {
          page,
          limit,
          total: registrations?.length || 0,
          totalPages: Math.ceil((registrations?.length || 0) / limit)
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

