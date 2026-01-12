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
      // Try to find 2-leg (via) routes: route A (contains start), route B (contains end), with a common transfer stop
      const routesContainingStart = routesData.filter(r => r.stops.some(s => s.id === startStopId));
      const routesContainingEnd = routesData.filter(r => r.stops.some(s => s.id === endStopId));
      const viaSuggestions = [];

      routesContainingStart.forEach(r1 => {
        routesContainingEnd.forEach(r2 => {
          if (r1.id === r2.id) return; // already considered as direct

          const r1StopIds = r1.stops.map(s => s.id);
          const r2StopIds = r2.stops.map(s => s.id);
          const common = r1StopIds.filter(id => r2StopIds.includes(id));

          common.forEach(transferId => {
            const startIndexA = r1.stops.findIndex(s => s.id === startStopId);
            const transferIndexA = r1.stops.findIndex(s => s.id === transferId);
            const stopsCountA = Math.abs(transferIndexA - startIndexA);
            const estA = r1.type === 'airway' ? (parseInt(r1.schedule.duration) || 0) * 60 : stopsCountA * 12;

            const transferIndexB = r2.stops.findIndex(s => s.id === transferId);
            const endIndexB = r2.stops.findIndex(s => s.id === endStopId);
            const stopsCountB = Math.abs(endIndexB - transferIndexB);
            const estB = r2.type === 'airway' ? (parseInt(r2.schedule.duration) || 0) * 60 : stopsCountB * 12;

            const total = estA + estB;

            viaSuggestions.push({
              routeId: `${r1.id}+${r2.id}`,
              routeName: `${r1.name} → ${r2.name}`,
              routeColor: r1.color,
              routeType: 'via',
              legs: [
                {
                  routeId: r1.id,
                  routeName: r1.name,
                  routeColor: r1.color,
                  routeType: r1.type,
                  startStop: r1.stops[startIndexA].name,
                  endStop: r1.stops[transferIndexA].name,
                  stopsCount: stopsCountA,
                  estimatedTime: estA
                },
                {
                  routeId: r2.id,
                  routeName: r2.name,
                  routeColor: r2.color,
                  routeType: r2.type,
                  startStop: r2.stops[transferIndexB].name,
                  endStop: r2.stops[endIndexB].name,
                  stopsCount: stopsCountB,
                  estimatedTime: estB
                }
              ],
              stopsCount: stopsCountA + stopsCountB,
              estimatedTime: total
            });
          });
        });
      });

      if (viaSuggestions.length > 0) {
        return res.json({
          success: true,
          data: {
            message: 'No direct routes found. Suggested 2-leg (via) routes:',
            suggestedRoutes: viaSuggestions,
            requiresTransfer: true
          }
        });
      }

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