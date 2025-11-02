const express = require('express');
const router = express.Router();
const supabase = require('../../config/supabase');
const { authenticateAdmin, requireAdminOrSuper } = require('../../middleware/auth');

/**
 * POST /admin/rewards
 * Create reward
 */
router.post('/', requireAdminOrSuper, async (req, res) => {
  const { data: reward, error } = await supabase
    .from('rewards')
    .insert(req.body)
    .select()
    .single();
  
  if (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'CREATION_FAILED', message: 'Failed to create reward' }
    });
  }
  
  res.status(201).json({ success: true, data: reward });
});

/**
 * PUT /admin/rewards/:id
 * Update reward
 */
router.put('/:id', requireAdminOrSuper, async (req, res) => {
  const { data: reward, error } = await supabase
    .from('rewards')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  
  if (error || !reward) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Reward not found' }
    });
  }
  
  res.json({ success: true, data: reward });
});

/**
 * DELETE /admin/rewards/:id
 * Delete reward
 */
router.delete('/:id', requireAdminOrSuper, async (req, res) => {
  const { error } = await supabase
    .from('rewards')
    .delete()
    .eq('id', req.params.id);
  
  if (error) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Reward not found' }
    });
  }
  
  res.json({ success: true, message: 'Reward deleted successfully' });
});

module.exports = router;

