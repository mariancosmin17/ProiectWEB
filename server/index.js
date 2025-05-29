const http = require('http');
const url = require('url');
const { PORT } = require('./config');
const { handleCorsOptions } = require('./utils/corsHeaders');
const { handleAbrevieriRoutes } = require('./routes/abrevieri');
const { handleAbrevieriEditRoutes } = require('./routes/abrevieri-edit');
const { handleAbrevieriDeleteRoutes } = require('./routes/abrevieri-delete');
const { handleAuthRoutes } = require('./routes/auth');
const { handleUtilizatoriRoutes } = require('./routes/utilizatori');


const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
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


  // 404 Not Found
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
