const express = require('express');
const router = express.Router();
const supabase = require('../../config/supabase');
const { requireSuperAdmin } = require('../../middleware/auth');
const { validateQuery, paginationSchema } = require('../../utils/validators');

router.get('/', requireSuperAdmin, validateQuery(paginationSchema), async (req, res) => {
  try {
    let query = supabase.from('audit_logs').select('*');
    
    if (req.query.action) query = query.eq('action', req.query.action);
    if (req.query.resource_type) query = query.eq('resource_type', req.query.resource_type);
    if (req.query.admin_id) query = query.eq('admin_id', req.query.admin_id);
    
    query = query.order('created_at', { ascending: false });
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data: logs } = await query.range(from, to);
    
    res.json({
      success: true,
      data: {
        logs: logs || [],
        pagination: { page, limit, total: logs?.length || 0 }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

module.exports = router;

