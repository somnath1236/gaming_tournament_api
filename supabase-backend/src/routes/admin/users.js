const express = require('express');
const router = express.Router();
const supabase = require('../../config/supabase');
const { authenticateAdmin, requireAdminOrSuper } = require('../../middleware/auth');
const { validateQuery, paginationSchema } = require('../../utils/validators');

/**
 * GET /admin/users
 * List all users
 */
router.get('/', authenticateAdmin, validateQuery(paginationSchema), async (req, res) => {
  try {
    let query = supabase.from('users').select('*');
    
    if (req.query.search) {
      query = query.or(`email.ilike.%${req.query.search}%,full_name.ilike.%${req.query.search}%,in_game_name.ilike.%${req.query.search}%`);
    }
    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data: users } = await query.range(from, to);
    
    res.json({
      success: true,
      data: {
        users: users || [],
        pagination: { page, limit, total: users?.length || 0 }
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
 * GET /admin/users/:id
 * Get user details
 */
router.get('/:id', authenticateAdmin, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.params.id)
    .single();
  
  if (error || !user) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' }
    });
  }
  
  res.json({ success: true, data: user });
});

/**
 * POST /admin/users/:id/suspend
 * Suspend user
 */
router.post('/:id/suspend', requireAdminOrSuper, async (req, res) => {
  const { error } = await supabase
    .from('users')
    .update({ status: 'suspended' })
    .eq('id', req.params.id);
  
  if (error) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' }
    });
  }
  
  res.json({ success: true, message: 'User suspended successfully' });
});

/**
 * POST /admin/users/:id/ban
 * Ban user
 */
router.post('/:id/ban', requireAdminOrSuper, async (req, res) => {
  const { error } = await supabase
    .from('users')
    .update({ status: 'banned' })
    .eq('id', req.params.id);
  
  if (error) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' }
    });
  }
  
  res.json({ success: true, message: 'User banned successfully' });
});

/**
 * POST /admin/users/:id/unban
 * Unban user
 */
router.post('/:id/unban', requireAdminOrSuper, async (req, res) => {
  const { error } = await supabase
    .from('users')
    .update({ status: 'active' })
    .eq('id', req.params.id);
  
  if (error) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' }
    });
  }
  
  res.json({ success: true, message: 'User unbanned successfully' });
});

/**
 * POST /admin/users/:id/adjust-coins
 * Adjust user coins
 */
router.post('/:id/adjust-coins', requireAdminOrSuper, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    const { data: currentUser } = await supabase.from('users').select('coins_balance').eq('id', req.params.id).single();
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }
    
    await supabase
      .from('users')
      .update({ coins_balance: (parseFloat(currentUser.coins_balance) || 0) + parseFloat(amount) })
      .eq('id', req.params.id);
    
    res.json({ success: true, message: 'Coins adjusted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

module.exports = router;

