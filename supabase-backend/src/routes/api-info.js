const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Read API endpoints from root directory
const apiEndpointsPath = path.join(__dirname, '../../../API_ENDPOINTS.json');
const apiEndpoints = JSON.parse(fs.readFileSync(apiEndpointsPath, 'utf8'));

/**
 * GET /api-info
 * Get all API endpoints documentation
 */
router.get('/', (req, res) => {
  try {
    const info = {
      totalEndpoints: apiEndpoints.totalEndpoints,
      applicationEndpoints: apiEndpoints.applicationEndpoints?.total || 0,
      adminEndpoints: apiEndpoints.adminEndpoints?.total || 0,
      websocketEndpoints: 3, // Manually set based on docs
      baseUrl: req.protocol + '://' + req.get('host'),
      version: apiEndpoints.version,
      project: apiEndpoints.project
    };
    
    res.json({
      success: true,
      data: apiEndpoints,
      info: info
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

module.exports = router;

