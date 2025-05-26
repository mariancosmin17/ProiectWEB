const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const { getCorsHeaders } = require('../utils/corsHeaders');

function handleAbrevieriEditRoutes(req, res, parsedUrl) {
  if (req.method === 'PUT' && parsedUrl.pathname.startsWith('/api/abrevieri/')) {
    verifyToken(req, res, (decoded) => {
      if (decoded.role === 'guest') {
        res.writeHead(403, getCorsHeaders());
        res.end(JSON.stringify({ 
          succes: false, 
          mesaj: 'Nu ai drepturi suficiente pentru a edita abrevieri.' 
        }));
        return;
      }
      
      const id = parseInt(parsedUrl.pathname.split('/').pop());
      
      if (isNaN(id)) {
        res.writeHead(400, getCorsHeaders());
        res.end(JSON.stringify({ 
          succes: false, 
          mesaj: 'ID invalid!' 
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
          
          let query = 'SELECT * FROM abrevieri WHERE id = ?';
          db.get(query, [id], (err, row) => {
            if (err) {
              res.writeHead(500, getCorsHeaders());
              res.end(JSON.stringify({ 
                succes: false, 
                mesaj: 'Eroare la interogarea bazei de date.' 
              }));
              return;
            }
            
            if (!row) {
              res.writeHead(404, getCorsHeaders());
              res.end(JSON.stringify({ 
                succes: false, 
                mesaj: 'Abrevierea nu a fost găsită.' 
              }));
              return;
            }
            
            if (row.autor !== decoded.username && decoded.role !== 'admin') {
              res.writeHead(403, getCorsHeaders());
              res.end(JSON.stringify({ 
                succes: false, 
                mesaj: 'Nu ai permisiunea de a edita această abreviere.' 
              }));
              return;
            }
            
            db.run(
              'UPDATE abrevieri SET abreviere = ?, semnificatie = ?, limba = ?, domeniu = ? WHERE id = ?',
              [abreviere, semnificatie, limba, domeniu, id],
              function (err) {
                if (err) {
                  console.error('Eroare SQL:', err);
                  res.writeHead(400, getCorsHeaders());
                  res.end(JSON.stringify({ 
                    succes: false, 
                    mesaj: 'Eroare la actualizarea abrevierii.' 
                  }));
                  return;
                }
                
                if (this.changes === 0) {
                  res.writeHead(404, getCorsHeaders());
                  res.end(JSON.stringify({ 
                    succes: false, 
                    mesaj: 'Abrevierea nu a fost găsită.' 
                  }));
                  return;
                }
                
                res.writeHead(200, getCorsHeaders());
                res.end(JSON.stringify({ 
                  succes: true, 
                  mesaj: 'Abreviere actualizată cu succes!' 
                }));
              }
            );
          });
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
  handleAbrevieriEditRoutes
};
