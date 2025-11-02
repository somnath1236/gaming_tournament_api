const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { validateQuery, paginationSchema } = require('../utils/validators');

/**
 * GET /users/me/notifications
 * Get user notifications
 */
router.get('/', authenticateUser, validateQuery(paginationSchema), async (req, res) => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id);
    
    if (req.query.is_read !== undefined) {
      query = query.eq('is_read', req.query.is_read === 'true');
    }
    
    query = query.order('created_at', { ascending: false });
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data: notifications, error } = await query.range(from, to);
    
    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);
    
    res.json({
      success: true,
      data: {
        notifications: notifications || [],
        unreadCount: unreadCount || 0
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
 * PUT /users/me/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    
    if (error) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found' }
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

module.exports = router;

