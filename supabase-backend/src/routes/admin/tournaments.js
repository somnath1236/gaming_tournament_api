const express = require('express');
const router = express.Router();
const supabase = require('../../config/supabase');
const { authenticateAdmin, requireAdminOrSuper } = require('../../middleware/auth');

/**
 * POST /admin/tournaments
 * Create tournament
 */
router.post('/', requireAdminOrSuper, async (req, res) => {
  res.status(501).json({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Tournament creation not yet fully implemented' }
  });
});

/**
 * PUT /admin/tournaments/:id
 * Update tournament
 */
router.put('/:id', requireAdminOrSuper, async (req, res) => {
  try {
    const updates = req.body;
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error || !tournament) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tournament not found' }
      });
    }
    
    res.json({ success: true, data: tournament });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * DELETE /admin/tournaments/:id
 * Delete tournament
 */
router.delete('/:id', requireAdminOrSuper, async (req, res) => {
  const { error } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', req.params.id);
  
  if (error) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Tournament not found' }
    });
  }
  
  res.json({ success: true, message: 'Tournament deleted successfully' });
});

/**
 * POST /admin/tournaments/:id/cancel
 * Cancel tournament
 */
router.post('/:id/cancel', requireAdminOrSuper, async (req, res) => {
  await supabase
    .from('tournaments')
    .update({ status: 'cancelled' })
    .eq('id', req.params.id);
  
  res.json({ success: true, message: 'Tournament cancelled successfully' });
});

/**
 * GET /admin/tournaments/:id/registrations
 * Get tournament registrations
 */
router.get('/:id/registrations', authenticateAdmin, async (req, res) => {
  const { data: registrations } = await supabase
    .from('tournament_registrations')
    .select('*')
    .eq('tournament_id', req.params.id);
  
  res.json({ success: true, data: { registrations: registrations || [] } });
});

module.exports = router;

