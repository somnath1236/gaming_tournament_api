const express = require('express');
const router = express.Router();
const supabase = require('../../config/supabase');
const { authenticateAdmin, requireAdminOrSuper } = require('../../middleware/auth');
const { validateQuery, paginationSchema } = require('../../utils/validators');

/**
 * GET /admin/kyc
 * List KYC submissions
 */
router.get('/', authenticateAdmin, validateQuery(paginationSchema), async (req, res) => {
  try {
    let query = supabase.from('kyc_submissions').select('*');
    
    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data: submissions } = await query.range(from, to);
    
    res.json({
      success: true,
      data: {
        submissions: submissions || [],
        pagination: { page, limit, total: submissions?.length || 0 }
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
 * POST /admin/kyc/:id/verify
 * Verify KYC
 */
router.post('/:id/verify', requireAdminOrSuper, async (req, res) => {
  const { status, rejection_reason, notes } = req.body;
  
  const updates = {
    status,
    verified_by: req.admin.id,
    rejection_reason,
    notes
  };
  
  if (status === 'verified') {
    updates.verified_at = new Date().toISOString();
    // Update user KYC status
    const { data: submission } = await supabase
      .from('kyc_submissions')
      .select('user_id')
      .eq('id', req.params.id)
      .single();
    
    if (submission) {
      await supabase
        .from('users')
        .update({ kyc_verified: true })
        .eq('id', submission.user_id);
    }
  }
  
  await supabase
    .from('kyc_submissions')
    .update(updates)
    .eq('id', req.params.id);
  
  res.json({ success: true, message: 'KYC verification updated successfully' });
});

module.exports = router;

