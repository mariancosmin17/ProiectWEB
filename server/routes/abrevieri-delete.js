const cacheManager = require('../utils/cache-manager'); 
const { verifyToken } = require('../middleware/auth');
const { getCorsHeaders } = require('../utils/corsHeaders');

function handleAbrevieriDeleteRoutes(req, res, parsedUrl) {
  if (req.method === 'DELETE' && parsedUrl.pathname.startsWith('/api/abrevieri/')) {
    verifyToken(req, res, async (decoded) => {
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
      
      try {
    
        const abreviere = await cacheManager.getAbreviereById(id);
        
        if (!abreviere) {
          res.writeHead(404, getCorsHeaders());
          res.end(JSON.stringify({ 
            succes: false, 
            mesaj: 'Abrevierea nu a fost găsită.' 
          }));
          return;
        }
        
        if (abreviere.autor !== decoded.username && decoded.role !== 'admin') {
          res.writeHead(403, getCorsHeaders());
          res.end(JSON.stringify({ 
            succes: false, 
            mesaj: 'Nu ai permisiunea de a șterge această abreviere.' 
          }));
          return;
        }
        
      
        const result = await cacheManager.deleteAbreviere(id);
        
        console.log(`⚡ Abreviere ștearsă din cache în ~${Date.now() % 1000}ms`);
        
        if (result.succes) {
          res.writeHead(200, getCorsHeaders());
        } else {
          res.writeHead(404, getCorsHeaders());
        }
        
        res.end(JSON.stringify(result));
      } catch (error) {
        console.error('❌ Eroare la ștergerea abrevierii din cache:', error);
        res.writeHead(500, getCorsHeaders());
        res.end(JSON.stringify({ 
          succes: false, 
          mesaj: 'Eroare la ștergerea abrevierii.' 
        }));
      }
    });
    return true;
  }
  
  return false;
}

module.exports = {
  handleAbrevieriDeleteRoutes
};
