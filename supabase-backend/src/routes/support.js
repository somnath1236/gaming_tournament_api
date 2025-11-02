const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

/**
 * POST /support
 * Create support ticket
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { category, subject, description, attachments } = req.body;
    
    // Generate ticket number
    const ticketNumber = 'TKT-' + Date.now().toString(36).toUpperCase();
    
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber,
        user_id: req.user.id,
        category,
        subject,
        description,
        attachments
      })
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'TICKET_CREATION_FAILED', message: 'Failed to create ticket' }
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * GET /support/:id
 * Get ticket details
 */
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error || !ticket) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Ticket not found' }
      });
    }
    
    if (ticket.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' }
      });
    }
    
    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * POST /support/:id/reply
 * Reply to ticket
 */
router.post('/:id/reply', authenticateUser, async (req, res) => {
  try {
    const { message, attachments } = req.body;
    
    // Get ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, user_id')
      .eq('id', req.params.id)
      .single();
    
    if (ticketError || !ticket || ticket.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' }
      });
    }
    
    // Create message
    const { data: ticketMessage, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: req.params.id,
        sender_type: 'user',
        sender_id: req.user.id,
        message,
        attachments
      })
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'REPLY_FAILED', message: 'Failed to send reply' }
      });
    }
    
    // Update ticket status
    await supabase
      .from('support_tickets')
      .update({ status: 'inProgress' })
      .eq('id', req.params.id);
    
    res.status(201).json({
      success: true,
      message: 'Reply sent successfully',
      data: ticketMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

module.exports = router;

