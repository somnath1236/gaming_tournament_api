const express = require('express');
const router = express.Router();
const supabase = require('../../config/supabase');
const { authenticateAdmin, requireAdminOrSuper } = require('../../middleware/auth');

router.get('/:id', authenticateAdmin, async (req, res) => {
  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', req.params.id)
    .single();
  
  if (!team) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Team not found' }
    });
  }
  
  res.json({ success: true, data: { team } });
});

router.put('/:id', requireAdminOrSuper, (req, res) => {
  res.json({ success: true, message: 'Team updated successfully' });
});

router.delete('/:id', requireAdminOrSuper, async (req, res) => {
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', req.params.id);
  
  if (error) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Team not found' }
    });
  }
  
  res.json({ success: true, message: 'Team deleted successfully' });
});

module.exports = router;

