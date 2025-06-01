const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { SALT_ROUNDS, SECRET_KEY } = require('../config');
const { getCorsHeaders } = require('../utils/corsHeaders');
const https = require('https');

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
          const token = jwt.sign(
            {
              id: user.id, // 🔑 Aici e cheia: trimitem id-ul utilizatorului în token
              username: user.username,
              role: user.rol || 'user'
            },
            SECRET_KEY,
            { expiresIn: '1h' }
          );

          res.writeHead(200, getCorsHeaders());
          res.end(JSON.stringify({ succes: true, token }));
        } else {
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

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function sendEmailWithCode(email, code) {
  const verifiedEmail = "aplce150@gmail.com";
  
  const data = JSON.stringify({
    personalizations: [{ to: [{ email: email }] }],
    from: { email: verifiedEmail, name: "APlace Password Reset" },
    subject: "Cod de verificare APlace",
    content: [{ type: "text/plain", value: `Codul tău de verificare este: ${code}` }]
  });
  
  const options = {
    hostname: "api.sendgrid.com",
    path: "/v3/mail/send",
    method: "POST",
    headers: {
      "Authorization": "Bearer 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",
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data) 
    }
  };
  
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          console.error("Eroare la email:", responseBody);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error("Eroare conexiune email:", error);
      resolve(false);
    });
    
    req.write(data);
    req.end();
  });
}

function handleForgotRequest(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const data = JSON.parse(body);
    const { email } = data;
    
    db.get('SELECT * FROM utilizatori WHERE email = ?', [email], (err, user) => {
      if (err || !user) {
        res.writeHead(400, getCorsHeaders());
        res.end(JSON.stringify({ succes: false, mesaj: 'Email invalid sau utilizator inexistent' }));
        return;
      }

      const code = generateVerificationCode();
      const expiry = Date.now() + 15 * 60 * 1000;

      db.run('UPDATE utilizatori SET reset_code = ?, reset_expiry = ? WHERE email = ?', 
        [code, expiry, email], async function(err) {
          if (err) {
            res.writeHead(500, getCorsHeaders());
            res.end(JSON.stringify({ succes: false }));
            return;
          }

          const success = await sendEmailWithCode(email, code);
          res.writeHead(success ? 200 : 500, getCorsHeaders());
          res.end(JSON.stringify({ succes: success }));
      });
    });
  });
}

function handleForgotVerify(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const { email, code } = JSON.parse(body);

    db.get('SELECT * FROM utilizatori WHERE email = ? AND reset_code = ?', [email, code], (err, user) => {
      if (err || !user || Date.now() > user.reset_expiry) {
        res.writeHead(401, getCorsHeaders());
        res.end(JSON.stringify({ succes: false, mesaj: 'Cod invalid sau expirat' }));
        return;
      }

      res.writeHead(200, getCorsHeaders());
      res.end(JSON.stringify({ succes: true }));
    });
  });
}

function handleForgotReset(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const { email, parolaNoua } = JSON.parse(body);

    bcrypt.hash(parolaNoua, SALT_ROUNDS, (err, hashNou) => {
      if (err) {
        res.writeHead(500, getCorsHeaders());
        res.end(JSON.stringify({ succes: false }));
        return;
      }

      db.run('UPDATE utilizatori SET parola = ?, reset_code = NULL, reset_expiry = NULL WHERE email = ?',
        [hashNou, email], function(err) {
          res.writeHead(err ? 500 : 200, getCorsHeaders());
          res.end(JSON.stringify({ succes: !err }));
        });
    });
  });
}

function handleGuestLogin(req, res) {
  const token = jwt.sign(
    { username: 'vizitator', role: 'guest' },
    SECRET_KEY,
    { expiresIn: '1h' }
  );

  res.writeHead(200, getCorsHeaders());
  res.end(JSON.stringify({ succes: true, token }));
}

function handleAuthRoutes(req, res, parsedUrl) {
  if (req.method === 'POST' && parsedUrl.pathname === '/api/login') return handleLogin(req, res), true;
  if (req.method === 'POST' && parsedUrl.pathname === '/api/register') return handleRegister(req, res), true;
  if (req.method === 'POST' && parsedUrl.pathname === '/api/forgot-request') return handleForgotRequest(req, res), true;
  if (req.method === 'POST' && parsedUrl.pathname === '/api/forgot-verify') return handleForgotVerify(req, res), true;
  if (req.method === 'POST' && parsedUrl.pathname === '/api/forgot-reset') return handleForgotReset(req, res), true;
  if (req.method === 'POST' && parsedUrl.pathname === '/api/login-guest') return handleGuestLogin(req, res), true;

  return false;
}

module.exports = {
  handleAuthRoutes
};
