const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const { getCorsHeaders } = require('../utils/corsHeaders');

function handleAbrevieriDeleteRoutes(req, res, parsedUrl) {
  if (req.method === 'DELETE' && parsedUrl.pathname.startsWith('/api/abrevieri/')) {
    verifyToken(req, res, (decoded) => {
      if (decoded.role === 'guest') {
        res.writeHead(403, getCorsHeaders());
        res.end(JSON.stringify({ 
          succes: false, 
          mesaj: 'Nu ai drepturi suficiente pentru a șterge abrevieri.' 
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
      
      db.get('SELECT * FROM abrevieri WHERE id = ?', [id], (err, row) => {
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
            mesaj: 'Nu ai permisiunea de a șterge această abreviere.' 
          }));
          return;
        }
        
        db.run('DELETE FROM abrevieri WHERE id = ?', [id], function (err) {
          if (err) {
            console.error('Eroare SQL:', err);
            res.writeHead(500, getCorsHeaders());
            res.end(JSON.stringify({ 
              succes: false, 
              mesaj: 'Eroare la ștergerea abrevierii.' 
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
            mesaj: 'Abreviere ștearsă cu succes!' 
          }));
        });
      });
    });
    return true;
  }
  
  return false;
}

module.exports = {
  handleAbrevieriDeleteRoutes
};