const { getAllStats } = require('../utils/statistics-manager');
const { verifyToken } = require('../middleware/auth');
const { getCorsHeaders } = require('../utils/corsHeaders');

function handleStatisticsRoutes(req, res, parsedUrl) {
  if (req.method === 'GET' && parsedUrl.pathname === '/api/statistics') {
    verifyToken(req, res, async () => {
      try {
        const stats = await getAllStats();
        res.writeHead(200, getCorsHeaders());
        res.end(JSON.stringify(stats));
      } catch (error) {
        res.writeHead(500, getCorsHeaders());
        res.end(JSON.stringify({ error: 'Eroare statistici' }));
      }
    });
    return true;
  }
  return false;
}

module.exports = { handleStatisticsRoutes };