// const db = require('../db'); // Nu mai folosim baza de date
const docbookManager = require('../utils/docbookManager');
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
      req.on('end', async () => {
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
          
          const abreviereExistenta = await docbookManager.getAbreviereById(id);
          
          if (!abreviereExistenta) {
            res.writeHead(404, getCorsHeaders());
            res.end(JSON.stringify({ 
              succes: false, 
              mesaj: 'Abrevierea nu a fost găsită.' 
            }));
            return;
          }
          
          if (abreviereExistenta.autor !== decoded.username && decoded.role !== 'admin') {
            res.writeHead(403, getCorsHeaders());
            res.end(JSON.stringify({ 
              succes: false, 
              mesaj: 'Nu ai permisiunea de a edita această abreviere.' 
            }));
            return;
          }
          
          const result = await docbookManager.updateAbreviere(id, {
            abreviere,
            semnificatie,
            limba,
            domeniu
          });
          
          if (result.succes) {
            res.writeHead(200, getCorsHeaders());
          } else {
            res.writeHead(404, getCorsHeaders());
          }
          
          res.end(JSON.stringify(result));
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
