const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { validateQuery, paginationSchema } = require('../utils/validators');

/**
 * GET /streams
 * List live streams
 */
router.get('/', validateQuery(paginationSchema), async (req, res) => {
  try {
    let query = supabase.from('streams').select('*');
    
    if (req.query.game) query = query.eq('game', req.query.game);
    if (req.query.status) query = query.eq('status', req.query.status);
    if (req.query.is_official !== undefined) {
      query = query.eq('is_official', req.query.is_official === 'true');
    }
    
    query = query.order('viewer_count', { ascending: false });
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data: streams } = await query.range(from, to);
    
    res.json({
      success: true,
      data: {
        streams: streams || [],
        pagination: {
          page,
          limit,
          total: streams?.length || 0,
          totalPages: Math.ceil((streams?.length || 0) / limit)
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
 * GET /streams/:id
 * Get stream details
 */
router.get('/:id', async (req, res) => {
  try {
    const { data: stream, error } = await supabase
      .from('streams')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error || !stream) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Stream not found' }
      });
    }
    
    res.json({
      success: true,
      data: { stream }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

/**
 * GET /streams/:id/watch
 * Watch stream
 */
router.get('/:id/watch', async (req, res) => {
  try {
    const { data: stream, error } = await supabase
      .from('streams')
      .select('*, streamer:streamers(*)')
      .eq('id', req.params.id)
      .single();
    
    if (error || !stream) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Stream not found' }
      });
    }
    
    // Increment viewer count
    const { data: currentStream } = await supabase.from('streams').select('viewer_count').eq('id', req.params.id).single();
    if (currentStream) {
      await supabase.from('streams').update({ viewer_count: (parseInt(currentStream.viewer_count) || 0) + 1 }).eq('id', req.params.id);
    }
    
    res.json({
      success: true,
      data: {
        streamUrl: stream.stream_url,
        streamer: stream.streamer,
        viewerCount: (parseInt(stream.viewer_count) || 0) + 1
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

