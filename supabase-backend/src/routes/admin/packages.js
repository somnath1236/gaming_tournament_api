const express = require('express');
const router = express.Router();
const supabase = require('../../config/supabase');
const { requireAdminOrSuper } = require('../../middleware/auth');

router.post('/', requireAdminOrSuper, async (req, res) => {
  const { data: package, error } = await supabase
    .from('coin_packages')
    .insert(req.body)
    .select()
    .single();
  
  if (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'CREATION_FAILED', message: 'Failed to create package' }
    });
  }
  
  res.status(201).json({ success: true, data: package });
});

router.put('/:id', requireAdminOrSuper, async (req, res) => {
  const { data: package, error } = await supabase
    .from('coin_packages')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  
  if (error || !package) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Package not found' }
    });
  }
  
  res.json({ success: true, data: package });
});

router.delete('/:id', requireAdminOrSuper, async (req, res) => {
  const { error } = await supabase
    .from('coin_packages')
    .delete()
    .eq('id', req.params.id);
  
  if (error) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Package not found' }
    });
  }
  
  res.json({ success: true, message: 'Package deleted successfully' });
});

module.exports = router;

