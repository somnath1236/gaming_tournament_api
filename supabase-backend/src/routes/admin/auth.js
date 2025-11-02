const express = require('express');
const router = express.Router();
const supabase = require('../../config/supabase');
const { generateToken, generateRefreshToken } = require('../../utils/jwt');
const { comparePassword } = require('../../utils/bcrypt');
const { authenticateAdmin } = require('../../middleware/auth');

/**
 * POST /admin/auth/login
 * Admin login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !admin) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' }
      });
    }
    
    const isPasswordValid = await comparePassword(password, admin.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' }
      });
    }
    
    // Update last login
    await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);
    
    const token = generateToken({ sub: admin.id }, true);
    const refreshToken = generateRefreshToken({ sub: admin.id });
    
    res.json({
      success: true,
      data: {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions || [],
        token,
        refreshToken
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
 * POST /admin/auth/logout
 * Admin logout
 */
router.post('/logout', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * GET /admin/auth/profile
 * Get admin profile
 */
router.get('/profile', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.admin.id,
      email: req.admin.email,
      role: req.admin.role,
      permissions: req.admin.permissions || []
    }
  });
});

module.exports = router;

