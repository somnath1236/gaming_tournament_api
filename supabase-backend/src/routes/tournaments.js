const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { validateQuery, tournamentFilterSchema } = require('../utils/validators');

/**
 * GET /tournaments
 * List all tournaments with filters
 */
router.get('/', validateQuery(tournamentFilterSchema), async (req, res) => {
  try {
    let query = supabase
      .from('tournaments')
      .select('*');
    
    // Apply filters
    if (req.query.game) {
      query = query.eq('game', req.query.game);
    }
    if (req.query.entry_fee) {
      query = query.eq('entry_fee_type', req.query.entry_fee);
    }
    if (req.query.type) {
      query = query.eq('team_size', req.query.type);
    }
    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }
    
    // Sorting
    if (req.query.sort_by === 'prize') {
      query = query.order('prize_pool', { ascending: false });
    } else if (req.query.sort_by === 'entryFee') {
      query = query.order('entry_fee', { ascending: true });
    } else if (req.query.sort_by === 'startDate') {
      query = query.order('start_date', { ascending: true });
    } else if (req.query.sort_by === 'popularity') {
      query = query.order('current_participants', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    // Get total count
    const { count } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true });
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to);
    
    const { data: tournaments, error } = await query;
    
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch tournaments' }
      });
    }
    
    res.json({
      success: true,
      data: {
        tournaments: tournaments || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * GET /tournaments/:id
 * Get tournament details
 */
router.get('/:id', async (req, res) => {
  try {
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error || !tournament) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tournament not found' }
      });
    }
    
    res.json({
      success: true,
      data: { tournament }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * POST /tournaments/:id/register
 * Register for tournament
 */
router.post('/:id/register', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get tournament
    const { data: tournament, error: tourError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (tourError || !tournament) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tournament not found' }
      });
    }
    
    // Check if already registered
    const { data: existing } = await supabase
      .from('tournament_registrations')
      .select('id')
      .eq('tournament_id', id)
      .eq('user_id', req.user.id)
      .single();
    
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_REGISTERED', message: 'Already registered for this tournament' }
      });
    }
    
    // Check if full
    if (tournament.current_participants >= tournament.max_participants) {
      return res.status(422).json({
        success: false,
        error: { code: 'TOURNAMENT_FULL', message: 'Tournament is full' }
      });
    }
    
    // Check deadline
    const now = new Date();
    const deadline = new Date(tournament.registration_deadline);
    if (now > deadline) {
      return res.status(422).json({
        success: false,
        error: { code: 'DEADLINE_PASSED', message: 'Registration deadline has passed' }
      });
    }
    
    // Create registration
    const { data: registration, error: regError } = await supabase
      .from('tournament_registrations')
      .insert({
        tournament_id: id,
        user_id: req.user.id,
        status: 'registered'
      })
      .select()
      .single();
    
    if (regError) {
      return res.status(500).json({
        success: false,
        error: { code: 'REGISTRATION_FAILED', message: 'Failed to register' }
      });
    }
    
    // Update participant count
    const { data: tourney } = await supabase.from('tournaments').select('current_participants').eq('id', id).single();
    if (tourney) {
      await supabase.from('tournaments').update({ current_participants: (parseInt(tourney.current_participants) || 0) + 1 }).eq('id', id);
    }
    
    res.status(201).json({
      success: true,
      message: 'Successfully registered for tournament',
      data: {
        id: registration.id,
        tournament: tournament,
        registration: registration
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
 * GET /tournaments/:id/brackets
 * Get tournament bracket structure
 */
router.get('/:id/brackets', async (req, res) => {
  // TODO: Implement bracket structure
  res.status(501).json({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Brackets not yet implemented' }
  });
});

/**
 * GET /tournaments/:id/participants
 * Get tournament participants
 */
router.get('/:id/participants', async (req, res) => {
  try {
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('id, current_participants, max_participants')
      .eq('id', req.params.id)
      .single();
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tournament not found' }
      });
    }
    
    // Get registered participants
    const { data: registrations } = await supabase
      .from('tournament_registrations')
      .select('*, user:users(full_name, in_game_name, primary_game)')
      .eq('tournament_id', req.params.id)
      .order('registered_at', { ascending: true });
    
    res.json({
      success: true,
      data: {
        totalRegistered: tournament.current_participants,
        maxParticipants: tournament.max_participants,
        teams: registrations || []
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
 * GET /tournaments/:id/streams
 * Get tournament-related streams
 */
router.get('/:id/streams', async (req, res) => {
  const { data: streams } = await supabase
    .from('streams')
    .select('*')
    .eq('tournament_id', req.params.id);
  
  res.json({
    success: true,
    data: {
      featuredStream: null,
      communityStreams: streams || []
    }
  });
});

/**
 * GET /tournaments/:id/schedule
 * Get tournament schedule
 */
router.get('/:id/schedule', async (req, res) => {
  const { data: events } = await supabase
    .from('schedule_events')
    .select('*')
    .eq('tournament_id', req.params.id)
    .order('date', { ascending: true });
  
  res.json({
    success: true,
    data: { schedule: events || [] }
  });
});

/**
 * GET /tournaments/:id/prizes
 * Get prize distribution
 */
router.get('/:id/prizes', async (req, res) => {
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('prize_pool')
    .eq('id', req.params.id)
    .single();
  
  const { data: prizes } = await supabase
    .from('prize_tiers')
    .select('*')
    .eq('tournament_id', req.params.id)
    .order('rank', { ascending: true });
  
  res.json({
    success: true,
    data: {
      totalPrizePool: tournament?.prize_pool || 0,
      distribution: prizes || []
    }
  });
});

module.exports = router;

