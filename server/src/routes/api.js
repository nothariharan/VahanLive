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

// Optimize route between two stops (with multi-route support)
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
          message: 'No routes found between these stops. Please try different locations.',
          suggestedRoutes: [],
          requiresTransfer: false
        }
      });
    }

    // Separate direct and transfer routes
    const directRoutes = optimalRoutes.filter(r => r.isDirect);
    const transferRoutes = optimalRoutes.filter(r => !r.isDirect);

    res.json({
      success: true,
      data: {
        message: directRoutes.length > 0 
          ? `Found ${directRoutes.length} direct route(s)` 
          : `Found ${transferRoutes.length} route(s) with transfers`,
        suggestedRoutes: optimalRoutes,
        bestRoute: optimalRoutes[0],
        hasDirectRoute: directRoutes.length > 0,
        hasTransferRoute: transferRoutes.length > 0
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