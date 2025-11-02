const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { validateQuery, paginationSchema } = require('../utils/validators');

/**
 * GET /wallet/balance
 * Get wallet balance
 */
router.get('/balance', authenticateUser, async (req, res) => {
  res.json({
    success: true,
    data: {
      coinsBalance: parseFloat(req.user.coins_balance),
      cashBalance: parseFloat(req.user.cash_balance),
      pendingWithdrawals: parseFloat(req.user.pending_withdrawals)
    }
  });
});

/**
 * POST /wallet/top-up
 * Top up coins
 */
router.post('/top-up', authenticateUser, async (req, res) => {
  try {
    const { package_id, payment_method } = req.body;
    
    const { data: package, error } = await supabase
      .from('coin_packages')
      .select('*')
      .eq('id', package_id)
      .single();
    
    if (error || !package) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Package not found' }
      });
    }
    
    // Create transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: req.user.id,
        type: 'topUp',
        amount: parseFloat(package.amount),
        coins: parseFloat(package.coins + package.bonus_coins),
        status: 'pending',
        payment_method,
        package_id: package.id
      })
      .select()
      .single();
    
    if (txError) {
      return res.status(500).json({
        success: false,
        error: { code: 'TRANSACTION_FAILED', message: 'Failed to create transaction' }
      });
    }
    
    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * GET /wallet/packages
 * Get coin packages
 */
router.get('/packages', async (req, res) => {
  const { data: packages } = await supabase
    .from('coin_packages')
    .select('*')
    .order('amount', { ascending: true });
  
  res.json({
    success: true,
    data: packages || []
  });
});

/**
 * GET /wallet/transactions
 * Get transaction history
 */
router.get('/transactions', authenticateUser, validateQuery(paginationSchema), async (req, res) => {
  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.user.id);
    
    if (req.query.type) query = query.eq('type', req.query.type);
    if (req.query.status) query = query.eq('status', req.query.status);
    
    query = query.order('created_at', { ascending: false });
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data: transactions } = await query.range(from, to);
    
    res.json({
      success: true,
      data: {
        transactions: transactions || [],
        pagination: {
          page,
          limit,
          total: transactions?.length || 0,
          totalPages: Math.ceil((transactions?.length || 0) / limit)
        }
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
 * POST /wallet/withdraw
 * Withdraw funds
 */
router.post('/withdraw', authenticateUser, async (req, res) => {
  try {
    const { amount, method } = req.body;
    
    if (req.user.cash_balance < amount) {
      return res.status(422).json({
        success: false,
        error: { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance' }
      });
    }
    
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        user_id: req.user.id,
        type: 'withdrawal',
        amount: parseFloat(amount),
        status: 'pending',
        payment_method: method,
        description: `Withdrawal request via ${method}`
      })
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'WITHDRAWAL_FAILED', message: 'Failed to process withdrawal' }
      });
    }
    
    // Update user balance
    const { data: currentUser } = await supabase.from('users').select('cash_balance, pending_withdrawals').eq('id', req.user.id).single();
    if (currentUser) {
      await supabase
        .from('users')
        .update({
          pending_withdrawals: (parseFloat(currentUser.pending_withdrawals) || 0) + parseFloat(amount),
          cash_balance: (parseFloat(currentUser.cash_balance) || 0) - parseFloat(amount)
        })
        .eq('id', req.user.id);
    }
    
    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

module.exports = router;

