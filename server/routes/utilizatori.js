const { getCorsHeaders } = require('../utils/corsHeaders');
const { verifyToken } = require('../middleware/auth');
const db = require('../db');

function handleUserRoutes(req, res, parsedUrl) {
  const idPattern = /^\/api\/utilizatori\/(\d+)$/;
  const match = parsedUrl.pathname.match(idPattern);
  if (!match) return false;

  const userId = parseInt(match[1]);

  // === GET: Returnează datele de profil ===
  if (req.method === 'GET') {
    verifyToken(req, res, (decoded) => {
      db.get(
        'SELECT id, username, firstName, lastName, email, telefon, pozaProfil, about FROM utilizatori WHERE id = ?',
        [userId],
        (err, user) => {
          if (err || !user) {
            res.writeHead(404, getCorsHeaders());
            res.end(JSON.stringify({ succes: false, mesaj: 'Utilizatorul nu există' }));
            return;
          }

          res.writeHead(200, getCorsHeaders());
          res.end(JSON.stringify(user));
        }
      );
    });
    return true;
  }

  // === PUT: Actualizează datele de profil ===
  if (req.method === 'PUT') {
    verifyToken(req, res, (decoded) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        const data = JSON.parse(body);
        console.log('Date primite pentru update:', data);

        const campuri = [];
        const valori = [];

        if (data.firstName) {
          campuri.push('firstName = ?');
          valori.push(data.firstName);
        }
        if (data.lastName) {
          campuri.push('lastName = ?');
          valori.push(data.lastName);
        }
        if (data.email) {
          campuri.push('email = ?');
          valori.push(data.email);
        }
        if (data.telefon) {
          campuri.push('telefon = ?');
          valori.push(data.telefon);
        }
        if (data.pozaProfil) {
          campuri.push('pozaProfil = ?');
          valori.push(data.pozaProfil);
        }
        if (data.about) {
          campuri.push('about = ?');
          valori.push(data.about);
        }

        if (campuri.length === 0) {
          res.writeHead(400, getCorsHeaders());
          res.end(JSON.stringify({ succes: false, mesaj: 'Nimic de actualizat.' }));
          return;
        }

        const sql = `UPDATE utilizatori SET ${campuri.join(', ')} WHERE id = ?`;
        valori.push(userId);

        db.run(sql, valori, function (err) {
          if (err || this.changes === 0) {
            res.writeHead(400, getCorsHeaders());
            res.end(JSON.stringify({ succes: false, mesaj: 'Eroare la actualizare' }));
            return;
          }

          res.writeHead(200, getCorsHeaders());
          res.end(JSON.stringify({ succes: true }));
        });
      });
    });
    return true;
  }

  return false;
}

module.exports = {
  handleUserRoutes
};
