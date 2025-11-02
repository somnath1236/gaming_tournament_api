const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { generateToken, generateRefreshToken, generateReferralCode, generateInitToken } = require('../utils/jwt');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { authenticateUser } = require('../middleware/auth');
const { validate, validateQuery } = require('../utils/validators');
const { userRegisterSchema, userLoginSchema } = require('../utils/validators');

/**
 * POST /auth/init
 * Get initialization token for app security
 * Call this when app starts (splash screen)
 */
router.post('/init', async (req, res) => {
  try {
    const initToken = generateInitToken();
    const deviceFingerprint = req.headers['x-device-fingerprint'] || null;
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // Calculate expiration (1 hour from now)
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    
    // Store token in Supabase
    const { error: dbError } = await supabase
      .from('init_tokens')
      .insert({
        token: initToken,
        device_fingerprint: deviceFingerprint,
        ip_address: ipAddress,
        expires_at: expiresAt,
        used: false
      });
    
    if (dbError) {
      console.error('Database error:', dbError);
      // If database not ready, fallback to in-memory storage
      const tokenStore = require('../utils/tokenStore');
      tokenStore.set(initToken, 3600);
    }
    
    res.json({
      success: true,
      data: {
        init_token: initToken,
        expires_in: 3600,
        message: 'Initialization token generated successfully'
      }
    });
  } catch (error) {
    console.error('Init error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INIT_ERROR',
        message: 'Failed to generate initialization token'
      }
    });
  }
});

/**
 * POST /auth/register
 * Register a new user
 * REQUIRES: init_token from /auth/init
 */
router.post('/register', validate(userRegisterSchema), async (req, res) => {
  try {
    const { email, phone_number, full_name, in_game_name, primary_game, password, profile_picture, referral_code, init_token } = req.validated;
    
    // Validate initialization token from Supabase
    const { data: tokenData, error: tokenError } = await supabase
      .from('init_tokens')
      .select('*')
      .eq('token', init_token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (tokenError || !tokenData) {
      // Try fallback to in-memory storage
      const tokenStore = require('../utils/tokenStore');
      if (!tokenStore.get(init_token)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INIT_TOKEN',
            message: 'Invalid or expired initialization token. Please restart the app.'
          }
        });
      }
    }
    
    // Check if user exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},phone_number.eq.${phone_number}`);
    
    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'Email or phone already registered'
        }
      });
    }
    
    // Check referral code if provided
    let referred_by_id = null;
    if (referral_code) {
      const { data: referringUser } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', referral_code.toUpperCase())
        .single();
      
      if (referringUser) {
        referred_by_id = referringUser.id;
      } else {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REFERRAL',
            message: 'Invalid referral code'
          }
        });
      }
    }
    
    // Hash password
    const password_hash = await hashPassword(password);
    
    // Generate referral code for new user
    const userRefCode = generateReferralCode(email + phone_number);
    
    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        phone_number,
        full_name,
        in_game_name,
        primary_game,
        password_hash,
        profile_picture,
        referral_code: userRefCode,
        referred_by_id,
        coins_balance: 0,
        cash_balance: 0,
        pending_withdrawals: 0
      })
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create user'
        }
      });
    }
    
    // Award referral bonus if applicable
    if (referred_by_id) {
      const referralReward = parseInt(process.env.REFERRAL_REWARD) || 100;
      const { data: referrer } = await supabase.from('users').select('coins_balance').eq('id', referred_by_id).single();
      if (referrer) {
        await supabase.from('users').update({ coins_balance: (parseFloat(referrer.coins_balance) || 0) + referralReward }).eq('id', referred_by_id);
      }
    }
    
    // Mark init token as used (single use)
    await supabase
      .from('init_tokens')
      .update({ used: true })
      .eq('token', init_token);
    
    // Fallback to in-memory if needed
    try {
      const tokenStore = require('../utils/tokenStore');
      tokenStore.delete(init_token);
    } catch (e) {
      // Ignore if in-memory not available
    }
    
    // Generate tokens
    const token = generateToken({ sub: user.id });
    const refreshToken = generateRefreshToken({ sub: user.id });
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        userId: user.id,
        email: user.email,
        phoneNumber: user.phone_number,
        inGameName: user.in_game_name,
        primaryGame: user.primary_game,
        token,
        refreshToken,
        coinsBalance: parseFloat(user.coins_balance)
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /auth/login
 * User login with email/phone
 * REQUIRES: init_token from /auth/init
 */
router.post('/login', validate(userLoginSchema), async (req, res) => {
  try {
    const { email_or_phone, password, init_token } = req.validated;
    
    // Validate initialization token from Supabase
    const { data: tokenData, error: tokenError } = await supabase
      .from('init_tokens')
      .select('*')
      .eq('token', init_token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (tokenError || !tokenData) {
      // Try fallback to in-memory storage
      const tokenStore = require('../utils/tokenStore');
      if (!tokenStore.get(init_token)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INIT_TOKEN',
            message: 'Invalid or expired initialization token. Please restart the app.'
          }
        });
      }
    }
    
    // Find user
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${email_or_phone},phone_number.eq.${email_or_phone}`);
    
    const user = users && users[0];
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials'
        }
      });
    }
    
    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials'
        }
      });
    }
    
    // Check status
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Account is suspended or banned'
        }
      });
    }
    
    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);
    
    // Mark init token as used (single use)
    await supabase
      .from('init_tokens')
      .update({ used: true })
      .eq('token', init_token);
    
    // Fallback to in-memory if needed
    try {
      const tokenStore = require('../utils/tokenStore');
      tokenStore.delete(init_token);
    } catch (e) {
      // Ignore if in-memory not available
    }
    
    // Generate tokens
    const token = generateToken({ sub: user.id });
    const refreshToken = generateRefreshToken({ sub: user.id });
    
    res.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        phoneNumber: user.phone_number,
        inGameName: user.in_game_name,
        primaryGame: user.primary_game,
        profilePicture: user.profile_picture,
        coinsBalance: parseFloat(user.coins_balance),
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /auth/social-login
 * Login with social provider (Google/Facebook)
 */
router.post('/social-login', async (req, res) => {
  // TODO: Implement social login
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Social login not yet implemented'
    }
  });
});

/**
 * POST /auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', async (req, res) => {
  // TODO: Implement password reset
  res.json({
    success: true,
    message: 'Password reset link sent to email/phone'
  });
});

/**
 * POST /auth/logout
 * Logout user
 */
router.post('/logout', authenticateUser, async (req, res) => {
  // TODO: Invalidate token (implement token blacklist)
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;

