const db = require('../db');
const { getCorsHeaders } = require('../utils/corsHeaders');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');

function handleUtilizatoriRoutes(req, res, parsedUrl) {
  if (req.method === 'GET' && parsedUrl.pathname.match(/^\/api\/utilizatori\/\d+$/)) {
    const id = parsedUrl.pathname.split('/').pop();

    db.get(`
      SELECT id, username, email, rol, firstName, lastName, telefon, about, pozaProfil
      FROM utilizatori
      WHERE id = ?
    `, [id], (err, user) => {
      if (err || !user) {
        res.writeHead(404, getCorsHeaders());
        res.end(JSON.stringify({ succes: false, mesaj: 'Utilizator inexistent' }));
        return;
      }

      res.writeHead(200, getCorsHeaders());
      res.end(JSON.stringify(user));
    });
    return true;
  }

  if (req.method === 'PUT' && parsedUrl.pathname.match(/^\/api\/utilizatori\/\d+$/)) {
    const id = parsedUrl.pathname.split('/').pop();

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let data;
      try {
        data = JSON.parse(body);
      } catch (e) {
        res.writeHead(400, getCorsHeaders());
        res.end(JSON.stringify({ succes: false, mesaj: 'Body invalid' }));
        return;
      }

      let {
        firstName = '',
        lastName = '',
        email = '',
        telefon = '',
        about = '',
        pozaProfil = ''
      } = data;

      db.run(`
        UPDATE utilizatori SET
          firstName = ?, lastName = ?, email = ?, telefon = ?, about = ?, pozaProfil = ?
        WHERE id = ?
      `, [firstName, lastName, email, telefon, about, pozaProfil, id], function (err) {
        if (err) {
          console.error('❌ Eroare SQL la update utilizator:', err.message);
          res.writeHead(500, getCorsHeaders());
          res.end(JSON.stringify({ succes: false, mesaj: 'Eroare la actualizare profil' }));
          return;
        }

        res.writeHead(200, getCorsHeaders());
        res.end(JSON.stringify({ succes: true }));
      });
    });
    return true;
  }

  return false;
}

module.exports = { handleUtilizatoriRoutes };
