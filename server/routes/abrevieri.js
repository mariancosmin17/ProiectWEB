const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const { getCorsHeaders } = require('../utils/corsHeaders');

function handleAbrevieriRoutes(req, res, parsedUrl) {
  if (req.method === 'GET' && parsedUrl.pathname === '/api/abrevieri') {
    verifyToken(req, res, (decoded) => {
      
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
  
  else if (req.method === 'POST' && parsedUrl.pathname === '/api/abrevieri') {
    verifyToken(req, res, (decoded) => {
      
      if (decoded.role === 'guest') {
        res.writeHead(403, getCorsHeaders());
        res.end(JSON.stringify({ 
          succes: false, 
          mesaj: 'Nu ai drepturi suficiente pentru a adăuga abrevieri.' 
        }));
        return;
      }
      
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const { abreviere, semnificatie, limba, domeniu } = data;
          
          if (!abreviere || !semnificatie || !limba || !domeniu) {
            res.writeHead(400, getCorsHeaders());
            res.end(JSON.stringify({ 
              succes: false, 
              mesaj: 'Toate câmpurile sunt obligatorii!' 
            }));
            return;
          }
          
          const autor = decoded.username || 'necunoscut';
          
          db.run(
            'INSERT INTO abrevieri (abreviere, semnificatie, limba, domeniu, autor) VALUES (?, ?, ?, ?, ?)',
            [abreviere, semnificatie, limba, domeniu, autor],
            function (err) {
              if (err) {
                console.error('Eroare SQL:', err);
                res.writeHead(400, getCorsHeaders());
                res.end(JSON.stringify({ 
                  succes: false, 
                  mesaj: 'Eroare la inserare în baza de date.' 
                }));
                return;
              }

              res.writeHead(201, getCorsHeaders());
              res.end(JSON.stringify({ 
                succes: true, 
                mesaj: 'Abreviere adăugată cu succes!',
                id: this.lastID 
              }));
            }
          );
        } catch (err) {
          res.writeHead(400, getCorsHeaders());
          res.end(JSON.stringify({ 
            succes: false, 
            mesaj: 'Date invalide! Verifică formatul JSON.' 
          }));
        }
      });
    });
    return true;
  }

  return false;
}

module.exports = {
  handleAbrevieriRoutes
};
