// server/src/routes/api.js
import express from 'express';
import { routesData, findOptimalRoute, getAllStops } from '../data/routesData.js';

const router = express.Router();

// Get all routes
router.get('/routes', (req, res) => {
  try {
    res.json({
      success: true,
      data: routesData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching routes',
      error: error.message
    });
  }
});

// Get specific route by ID
router.get('/routes/:id', (req, res) => {
  try {
    const route = routesData.find(r => r.id === req.params.id);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }
    res.json({
      success: true,
      data: route
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching route',
      error: error.message
    });
  }
});

// Get all stops
router.get('/stops', (req, res) => {
  try {
    const stops = getAllStops();
    res.json({
      success: true,
      data: stops
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stops',
      error: error.message
    });
  }
});

// Optimize route between two stops
router.post('/optimize-route', (req, res) => {
  try {
    const { startStopId, endStopId } = req.body;
    
    if (!startStopId || !endStopId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both startStopId and endStopId'
      });
    }

    if (startStopId === endStopId) {
      return res.status(400).json({
        success: false,
        message: 'Start and end stops cannot be the same'
      });
    }

    const optimalRoutes = findOptimalRoute(startStopId, endStopId);
    
    if (optimalRoutes.length === 0) {
      return res.json({
        success: true,
        data: {
          message: 'No direct routes found. Consider multi-route journey.',
          suggestedRoutes: [],
          requiresTransfer: true
        }
      });
    }

    res.json({
      success: true,
      data: {
        message: `Found ${optimalRoutes.length} route(s)`,
        suggestedRoutes: optimalRoutes,
        bestRoute: optimalRoutes[0]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error optimizing route',
      error: error.message
    });
  }
});

export default router;