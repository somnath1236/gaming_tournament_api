const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

/**
 * GET /home/feed
 * Get home feed
 */
router.get('/feed', authenticateUser, async (req, res) => {
  try {
    // Featured tournaments
    const { data: featuredTournaments } = await supabase
      .from('tournaments')
      .select('id, name, prize_pool')
      .eq('status', 'upcoming')
      .order('prize_pool', { ascending: false })
      .limit(5);
    
    // Live streams
    const { data: liveStreams } = await supabase
      .from('streams')
      .select('id, title, viewer_count')
      .eq('status', 'live')
      .order('viewer_count', { ascending: false })
      .limit(5);
    
    // Upcoming tournaments
    const { data: upcomingTournaments } = await supabase
      .from('tournaments')
      .select('id, name, start_date')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(10);
    
    res.json({
      success: true,
      data: {
        featuredTournaments: featuredTournaments || [],
        liveStreams: liveStreams || [],
        upcomingTournaments: upcomingTournaments || []
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

