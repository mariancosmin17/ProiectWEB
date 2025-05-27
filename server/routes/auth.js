const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { SALT_ROUNDS, SECRET_KEY } = require('../config');
const { getCorsHeaders } = require('../utils/corsHeaders');
const http = require('http');
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
              username: user.username,
              role: user.rol || 'user'
            }, 
            SECRET_KEY, 
            { expiresIn: '1h' }
          );

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

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function sendEmailWithCode(email, code) {
  const verifiedEmail = "aplce150@gmail.com";
  
  const data = JSON.stringify({
    personalizations: [{ 
      to: [{ email: email }] 
    }],
    from: { 
      email: verifiedEmail, 
      name: "APlace Password Reset" 
    },
    subject: "Cod de verificare APlace",
    content: [{ 
      type: "text/plain", 
      value: `Codul tău de verificare este: ${code}` 
    }]
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
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log("Email trimis cu succes!");
          resolve(true);
        } else {
          console.error("Eroare la trimiterea email-ului:", responseBody);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error("Eroare la conexiune:", error);
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
      if (err) {
        res.writeHead(500, getCorsHeaders());
        res.end(JSON.stringify({ succes: false, mesaj: 'Eroare server' }));
        return;
      }
      
      if (!user) {
        res.writeHead(400, getCorsHeaders());
        res.end(JSON.stringify({ succes: false, mesaj: 'Nu există cont asociat acestui email' }));
        return;
      }
      
      const verificationCode = generateVerificationCode();
      const expiryTime = Date.now() + 15 * 60 * 1000; 
      
      db.run(
        'UPDATE utilizatori SET reset_code = ?, reset_expiry = ? WHERE email = ?',
        [verificationCode, expiryTime, email],
        function(err) {
          if (err) {
            res.writeHead(500, getCorsHeaders());
            res.end(JSON.stringify({ succes: false, mesaj: 'Eroare la actualizarea codului' }));
            return;
          }
          
          const emailSent = sendEmailWithCode(email, verificationCode);
          
          if (emailSent) {
            res.writeHead(200, getCorsHeaders());
            res.end(JSON.stringify({ succes: true, mesaj: 'Cod de verificare trimis pe email' }));
          } else {
            res.writeHead(500, getCorsHeaders());
            res.end(JSON.stringify({ succes: false, mesaj: 'Eroare la trimiterea email-ului' }));
          }
        }
      );
    });
  });
}

function handleForgotVerify(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const data = JSON.parse(body);
    const { email, code } = data;
    
    db.get(
      'SELECT * FROM utilizatori WHERE email = ? AND reset_code = ?',
      [email, code],
      (err, user) => {
        if (err) {
          res.writeHead(500, getCorsHeaders());
          res.end(JSON.stringify({ succes: false, mesaj: 'Eroare server' }));
          return;
        }
        
        if (!user) {
          res.writeHead(401, getCorsHeaders());
          res.end(JSON.stringify({ succes: false, mesaj: 'Cod invalid' }));
          return;
        }
        
        const currentTime = Date.now();
        if (user.reset_expiry < currentTime) {
          res.writeHead(401, getCorsHeaders());
          res.end(JSON.stringify({ succes: false, mesaj: 'Cod expirat' }));
          return;
        }

        res.writeHead(200, getCorsHeaders());
        res.end(JSON.stringify({ succes: true }));
      }
    );
  });
}

function handleForgotReset(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const data = JSON.parse(body);
    const { email, parolaNoua } = data;
    
    db.get(
      'SELECT * FROM utilizatori WHERE email = ? AND reset_code IS NOT NULL',
      [email],
      (err, user) => {
        if (err || !user) {
          res.writeHead(401, getCorsHeaders());
          res.end(JSON.stringify({ succes: false, mesaj: 'Sesiune de resetare invalidă' }));
          return;
        }
        
        bcrypt.hash(parolaNoua, SALT_ROUNDS, (err, hashNou) => {
          if (err) {
            res.writeHead(500, getCorsHeaders());
            res.end(JSON.stringify({ succes: false, mesaj: 'Eroare la criptare parolă' }));
            return;
          }
          
          db.run(
            'UPDATE utilizatori SET parola = ?, reset_code = NULL, reset_expiry = NULL WHERE email = ?',
            [hashNou, email],
            function(err) {
              if (err) {
                res.writeHead(500, getCorsHeaders());
                res.end(JSON.stringify({ succes: false, mesaj: 'Eroare la actualizarea parolei' }));
                return;
              }
              
              res.writeHead(200, getCorsHeaders());
              res.end(JSON.stringify({ succes: true, mesaj: 'Parola a fost actualizată cu succes' }));
            }
          );
        });
      }
    );
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
  
  //endpoint uri noi 
  if (req.method === 'POST' && parsedUrl.pathname === '/api/forgot-request') {
    handleForgotRequest(req, res);
    return true;
  }
  
  if (req.method === 'POST' && parsedUrl.pathname === '/api/forgot-verify') {
    handleForgotVerify(req, res);
    return true;
  }
  
  if (req.method === 'POST' && parsedUrl.pathname === '/api/forgot-reset') {
    handleForgotReset(req, res);
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
