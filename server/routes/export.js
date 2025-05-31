const exportManager = require('../utils/export-manager');
const { verifyToken } = require('../middleware/auth');
const { getCorsHeaders } = require('../utils/corsHeaders');

function handleExportRoutes(req, res, parsedUrl) {
  if (req.method === 'GET' && parsedUrl.pathname === '/api/export/html') {
    verifyToken(req, res, async (decoded) => {
      try {
        const result = await exportManager.exportToHtml();
        
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
        res.end(JSON.stringify({ error: 'Eroare la export HTML' }));
      }
    });
    return true;
  }
  
  if (req.method === 'GET' && parsedUrl.pathname === '/api/export/markdown') {
    verifyToken(req, res, async (decoded) => {
      try {
        const result = await exportManager.exportToMarkdown();
        
        if (result.succes) {
          res.writeHead(200, {
            ...getCorsHeaders(),
            'Content-Type': 'text/markdown; charset=utf-8',
            'Content-Disposition': `attachment; filename="${result.filename}"`
          });
          res.end(result.content);
        } else {
          res.writeHead(500, getCorsHeaders());
          res.end(JSON.stringify({ error: result.error }));
        }
      } catch (error) {
        res.writeHead(500, getCorsHeaders());
        res.end(JSON.stringify({ error: 'Eroare la export Markdown' }));
      }
    });
    return true;
  }
  
  return false;
}

module.exports = {
  handleExportRoutes
};
