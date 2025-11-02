const express = require('express');
const router = express.Router();
const supabase = require('../../config/supabase');
const { authenticateAdmin } = require('../../middleware/auth');

router.get('/', authenticateAdmin, async (req, res) => {
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });
  
  res.json({ success: true, data: { transactions: transactions || [] } });
});

router.post('/:id/approve', authenticateAdmin, async (req, res) => {
  await supabase
    .from('transactions')
    .update({ status: 'completed' })
    .eq('id', req.params.id);
  
  res.json({ success: true, message: 'Transaction approved successfully' });
});

module.exports = router;

