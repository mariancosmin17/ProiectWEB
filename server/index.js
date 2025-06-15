require('./utils/cache-manager');
const http = require('http');
const url = require('url');
const path = require('path');  
const fs = require('fs'); 
const PORT = process.env.PORT || 8080;
const { handleCorsOptions } = require('./utils/corsHeaders');
const { handleAbrevieriRoutes } = require('./routes/abrevieri');
const { handleAbrevieriEditRoutes } = require('./routes/abrevieri-edit');
const { handleAbrevieriDeleteRoutes } = require('./routes/abrevieri-delete');
const { handleAuthRoutes } = require('./routes/auth');
const { handleUtilizatoriRoutes } = require('./routes/utilizatori');
const { handleExportRoutes } = require('./routes/export');
const { handleStatisticsRoutes } = require('./routes/statistics');
const { handleRSSRoutes } = require('./routes/rss');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  if (req.method === 'GET' && !parsedUrl.pathname.startsWith('/api/')) {
    let filePath = parsedUrl.pathname;
    
    if (filePath === '/') {
      filePath = '/html/login.html';
    }
    
    const fullPath = path.join(__dirname, '../client', filePath);
    
    if (fs.existsSync(fullPath)) {
      const ext = path.extname(fullPath);
      const contentType = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css',
        '.js': 'application/javascript'
      }[ext] || 'text/plain';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(fs.readFileSync(fullPath));
      return;
    }
  }

  if (handleCorsOptions(req, res)) {
    return;
  }

  if (handleAbrevieriRoutes(req, res, parsedUrl)) {
    return;
  }
  
  if (handleAbrevieriEditRoutes(req, res, parsedUrl)) {
    return;
  }
  
  if (handleAbrevieriDeleteRoutes(req, res, parsedUrl)) {
    return;
  }
  
  if (handleAuthRoutes(req, res, parsedUrl)) {
    return;
  }
  if (handleUtilizatoriRoutes(req, res, parsedUrl)) {
  return;
}
if (handleExportRoutes(req, res, parsedUrl)) return;

if (handleStatisticsRoutes(req, res, parsedUrl)) return;

if (handleRSSRoutes(req, res, parsedUrl)) { return; }
  res.writeHead(404, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  });
  res.end('404 Not Found');
});

server.listen(PORT, () => {
  console.log(`🚀 Server Node.js pornit pe http://localhost:${PORT}`);
});
