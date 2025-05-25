const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const { getCorsHeaders } = require('../utils/corsHeaders');

function handleAbrevieriRoutes(req, res, parsedUrl) {
  if (req.method === 'GET' && parsedUrl.pathname === '/api/abrevieri') {
    verifyToken(req, res, (decoded) => {
      // Token valid – deci returnăm datele
      db.all('SELECT * FROM abrevieri', [], (err, rows) => {
        if (err) {
          res.writeHead(500, getCorsHeaders());
          res.end(JSON.stringify({ error: 'Eroare la interogare DB' }));
          return;
        }

        res.writeHead(200, getCorsHeaders());
        res.end(JSON.stringify(rows));
      });
    });
    return true;
  }
  
  return false;
}

module.exports = {
  handleAbrevieriRoutes
};