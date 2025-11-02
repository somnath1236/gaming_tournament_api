const express = require('express');
const router = express.Router();
const supabase = require('../../config/supabase');
const { requireSuperAdmin } = require('../../middleware/auth');
const { hashPassword } = require('../../utils/bcrypt');

router.post('/', requireSuperAdmin, async (req, res) => {
  const { email, full_name, password, role, permissions } = req.body;
  
  const { data: existing } = await supabase
    .from('admins')
    .select('id')
    .eq('email', email)
    .single();
  
  if (existing) {
    return res.status(400).json({
      success: false,
      error: { code: 'EMAIL_EXISTS', message: 'Email already exists' }
    });
  }
  
  const password_hash = await hashPassword(password);
  
  const { data: admin, error } = await supabase
    .from('admins')
    .insert({ email, full_name, password_hash, role, permissions })
    .select()
    .single();
  
  if (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'CREATION_FAILED', message: 'Failed to create admin' }
    });
  }
  
  res.status(201).json({ success: true, data: admin });
});

router.put('/:id', requireSuperAdmin, (req, res) => {
  res.json({ success: true, data: {} });
});

router.delete('/:id', requireSuperAdmin, async (req, res) => {
  const { error } = await supabase
    .from('admins')
    .delete()
    .eq('id', req.params.id);
  
  if (error) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Admin not found' }
    });
  }
  
  res.json({ success: true, message: 'Admin deleted successfully' });
});

module.exports = router;

