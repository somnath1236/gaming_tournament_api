const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { validateQuery, paginationSchema } = require('../utils/validators');

/**
 * POST /teams
 * Create a new team
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { name, tag, logo, player_ids } = req.body;
    
    // Check if user is already in a team
    const { data: existingTeam } = await supabase
      .from('players')
      .select('team_id')
      .eq('user_id', req.user.id)
      .single();
    
    if (existingTeam) {
      return res.status(422).json({
        success: false,
        error: { code: 'ALREADY_IN_TEAM', message: 'You are already in a team' }
      });
    }
    
    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({ name, tag, logo, captain_id: req.user.id })
      .select()
      .single();
    
    if (teamError) {
      return res.status(500).json({
        success: false,
        error: { code: 'TEAM_CREATION_FAILED', message: 'Failed to create team' }
      });
    }
    
    // Add captain
    await supabase
      .from('players')
      .insert({
        team_id: team.id,
        user_id: req.user.id,
        in_game_name: req.user.in_game_name,
        profile_picture: req.user.profile_picture,
        is_captain: true
      });
    
    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * GET /teams
 * List all teams
 */
router.get('/', validateQuery(paginationSchema), async (req, res) => {
  try {
    let query = supabase.from('teams').select('*');
    
    if (req.query.search) {
      query = query.ilike('name', `%${req.query.search}%`);
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data: teams } = await query.range(from, to);
    
    res.json({
      success: true,
      data: {
        teams: teams || [],
        pagination: {
          page,
          limit,
          total: teams?.length || 0,
          totalPages: Math.ceil((teams?.length || 0) / limit)
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
 * GET /teams/:id
 * Get team details
 */
router.get('/:id', async (req, res) => {
  try {
    const { data: team, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error || !team) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Team not found' }
      });
    }
    
    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

module.exports = router;

