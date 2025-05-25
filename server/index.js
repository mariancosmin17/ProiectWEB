const http = require('http');
const url = require('url');
const { PORT } = require('./config');
const { handleCorsOptions } = require('./utils/corsHeaders');
const { handleAbrevieriRoutes } = require('./routes/abrevieri');
const { handleAuthRoutes } = require('./routes/auth');
const { handleUserRoutes } = require('./routes/utilizatori');


const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Verifică dacă este o cerere CORS OPTIONS
  if (handleCorsOptions(req, res)) {
    return;
  }

  // Încearcă să gestioneze rute de abrevieri
  if (handleAbrevieriRoutes(req, res, parsedUrl)) {
    return;
  }
  
  // Încearcă să gestioneze rute de autentificare
  if (handleAuthRoutes(req, res, parsedUrl)) {
    return;
  }

  if (handleUserRoutes(req, res, parsedUrl)) {
  return;
}


  // Dacă nu s-a găsit nicio rută potrivită
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