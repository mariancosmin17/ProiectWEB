const docbookManager = require('../utils/docbookManager');
const { verifyToken } = require('../middleware/auth');
const { getCorsHeaders } = require('../utils/corsHeaders');

function handleAbrevieriRoutes(req, res, parsedUrl) {
  if (req.method === 'GET' && parsedUrl.pathname === '/api/abrevieri') {
    verifyToken(req, res, async (decoded) => {
      try {
        let abrevieri = [];
        
        if (decoded.role !== 'admin' && decoded.role !== 'guest') {
          
          abrevieri = await docbookManager.getAbrevieriByAutor(decoded.username);
        } else {
        
          abrevieri = await docbookManager.getAbrevieri();
        }
        
        res.writeHead(200, getCorsHeaders());
        res.end(JSON.stringify(abrevieri));
      } catch (error) {
        console.error('Eroare la obținerea abrevierilor:', error);
        res.writeHead(500, getCorsHeaders());
        res.end(JSON.stringify({ error: 'Eroare la obținerea abrevierilor' }));
      }
    });
    return true;
  }
  
  else if (req.method === 'GET' && parsedUrl.pathname === '/api/toate-abrevierile') {
    verifyToken(req, res, async (decoded) => {
      try {
        const abrevieri = await docbookManager.getAbrevieri();
        
        res.writeHead(200, getCorsHeaders());
        res.end(JSON.stringify(abrevieri));
      } catch (error) {
        console.error('Eroare la obținerea tuturor abrevierilor:', error);
        res.writeHead(500, getCorsHeaders());
        res.end(JSON.stringify({ error: 'Eroare la obținerea abrevierilor' }));
      }
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
          
          const autor = decoded.username || 'necunoscut';
          const result = await docbookManager.addAbreviere({
            abreviere, 
            semnificatie, 
            limba, 
            domeniu, 
            autor
          });
          
          if (result.succes) {
            res.writeHead(201, getCorsHeaders());
          } else {
            res.writeHead(400, getCorsHeaders());
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
  handleAbrevieriRoutes
};
