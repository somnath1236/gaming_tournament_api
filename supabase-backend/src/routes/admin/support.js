const express = require('express');
const router = express.Router();
const supabase = require('../../config/supabase');
const { authenticateAdmin } = require('../../middleware/auth');

/**
 * GET /admin/support
 * List support tickets
 */
router.get('/', authenticateAdmin, async (req, res) => {
  let query = supabase.from('support_tickets').select('*');
  
  if (req.query.status) query = query.eq('status', req.query.status);
  if (req.query.category) query = query.eq('category', req.query.category);
  
  const { data: tickets } = await query;
  res.json({ success: true, data: { tickets: tickets || [] } });
});

/**
 * POST /admin/support/:id/assign
 * Assign ticket to admin
 */
router.post('/:id/assign', authenticateAdmin, async (req, res) => {
  await supabase
    .from('support_tickets')
    .update({ assigned_to: req.body.admin_id })
    .eq('id', req.params.id);
  
  res.json({ success: true, message: 'Ticket assigned successfully' });
});

/**
 * POST /admin/support/:id/reply
 * Reply to ticket
 */
router.post('/:id/reply', authenticateAdmin, async (req, res) => {
  await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: req.params.id,
      sender_type: 'admin',
      sender_id: req.admin.id,
      message: req.body.message,
      internal_notes: req.body.internal_notes
    });
  
  res.json({ success: true, message: 'Reply sent successfully' });
});

/**
 * POST /admin/support/:id/resolve
 * Resolve ticket
 */
router.post('/:id/resolve', authenticateAdmin, async (req, res) => {
  await supabase
    .from('support_tickets')
    .update({ 
      status: 'resolved',
      resolved_at: new Date().toISOString()
    })
    .eq('id', req.params.id);
  
  res.json({ success: true, message: 'Ticket resolved successfully' });
});

module.exports = router;

