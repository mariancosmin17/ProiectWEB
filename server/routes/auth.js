const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { SALT_ROUNDS, SECRET_KEY } = require('../config');
const { getCorsHeaders } = require('../utils/corsHeaders');

function handleLogin(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const data = JSON.parse(body);
    const { username, parola } = data;

    db.get('SELECT * FROM utilizatori WHERE username = ?', [username], (err, user) => {
      if (err) {
        res.writeHead(500, getCorsHeaders());
        res.end(JSON.stringify({ succes: false, mesaj: 'Eroare server' }));
        return;
      }

      if (!user) {
        res.writeHead(401, getCorsHeaders());
        res.end(JSON.stringify({ succes: false, mesaj: 'User inexistent' }));
        return;
      }

      bcrypt.compare(parola, user.parola, (err, rezultat) => {
        if (err) {
          res.writeHead(500, getCorsHeaders());
          res.end(JSON.stringify({ succes: false, mesaj: 'Eroare internă' }));
          return;
        }

        if (rezultat) {
          const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });

          res.writeHead(200, getCorsHeaders());
          res.end(JSON.stringify({ succes: true, token }));
        } else {
          console.log('❌ Parolă greșită');
          
          res.writeHead(401, getCorsHeaders());
          res.end(JSON.stringify({ succes: false, mesaj: 'Parolă greșită' }));
        }
      });
    });
  });
}

function handleRegister(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const data = JSON.parse(body);
    const { username, email, parola } = data;

    bcrypt.hash(parola, SALT_ROUNDS, (err, hash) => {
      if (err) {
        res.writeHead(500, getCorsHeaders());
        res.end(JSON.stringify({ succes: false, mesaj: 'Eroare la criptare parolă' }));
        return;
      }

      db.run('INSERT INTO utilizatori (username, email, parola, rol) VALUES (?, ?, ?, ?)', 
        [username, email, hash, 'user'], 
        function (err) {
          if (err) {
            res.writeHead(400, getCorsHeaders());
            res.end(JSON.stringify({ succes: false, mesaj: 'Utilizatorul există deja sau eroare.' }));
            return;
          }

          res.writeHead(201, getCorsHeaders());
          res.end(JSON.stringify({ succes: true }));
      });
    });
  });
}

function handleForgotPassword(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const data = JSON.parse(body);
    const { username, parolaNoua } = data;

    bcrypt.hash(parolaNoua, SALT_ROUNDS, (err, hashNou) => {
      if (err) {
        res.writeHead(500, getCorsHeaders());
        res.end(JSON.stringify({ succes: false, mesaj: 'Eroare la criptare parolă' }));
        return;
      }

      db.run('UPDATE utilizatori SET parola = ? WHERE username = ?', [hashNou, username], function (err) {
        if (err || this.changes === 0) {
          res.writeHead(400, getCorsHeaders());
          res.end(JSON.stringify({ succes: false, mesaj: 'Utilizator inexistent sau eroare' }));
          return;
        }

        res.writeHead(200, getCorsHeaders());
        res.end(JSON.stringify({ succes: true }));
      });
    });
  });
}

function handleGuestLogin(req, res) {
  const guestToken = jwt.sign(
    { username: 'vizitator', role: 'guest' },
    SECRET_KEY,
    { expiresIn: '1h' }
  );

  res.writeHead(200, getCorsHeaders());
  res.end(JSON.stringify({ succes: true, token: guestToken }));
}

function handleAuthRoutes(req, res, parsedUrl) {
  if (req.method === 'POST' && parsedUrl.pathname === '/api/login') {
    handleLogin(req, res);
    return true;
  }
  
  if (req.method === 'POST' && parsedUrl.pathname === '/api/register') {
    handleRegister(req, res);
    return true;
  }
  
  if (req.method === 'POST' && parsedUrl.pathname === '/api/forgot') {
    handleForgotPassword(req, res);
    return true;
  }
  
  if (req.method === 'POST' && parsedUrl.pathname === '/api/login-guest') {
    handleGuestLogin(req, res);
    return true;
  }
  
  return false;
}

module.exports = {
  handleAuthRoutes
};