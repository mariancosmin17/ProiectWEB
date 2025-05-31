const { getAllStats } = require('../utils/statistics-manager');
const { exportStatsToCSV, exportStatsToPDF } = require('../utils/statistics-export');
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
  
  if (req.method === 'GET' && parsedUrl.pathname === '/api/statistics/export/csv') {
    verifyToken(req, res, async () => {
      try {
        const result = await exportStatsToCSV();
        
        if (result.succes) {
          res.writeHead(200, {
            ...getCorsHeaders(),
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${result.filename}"`
          });
          res.end(result.content);
        } else {
          res.writeHead(500, getCorsHeaders());
          res.end(JSON.stringify({ error: result.error }));
        }
      } catch (error) {
        res.writeHead(500, getCorsHeaders());
        res.end(JSON.stringify({ error: 'Eroare export CSV' }));
      }
    });
    return true;
  }
  
  if (req.method === 'GET' && parsedUrl.pathname === '/api/statistics/export/pdf') {
    verifyToken(req, res, async () => {
      try {
        const result = await exportStatsToPDF();
        
        if (result.succes) {
          res.writeHead(200, {
            ...getCorsHeaders(),
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `attachment; filename="${result.filename}"`
          });
          res.end(result.content);
        } else {
          res.writeHead(500, getCorsHeaders());
          res.end(JSON.stringify({ error: result.error }));
        }
      } catch (error) {
        res.writeHead(500, getCorsHeaders());
        res.end(JSON.stringify({ error: 'Eroare export PDF' }));
      }
    });
    return true;
  }
  
  return false;
}

module.exports = { handleStatisticsRoutes };