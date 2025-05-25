const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');
const { getCorsHeaders } = require('../utils/corsHeaders');

function verifyToken(req, res, callback) {
  const auth = req.headers['authorization'];
  const token = auth && auth.split(' ')[1];

  if (!token) {
    res.writeHead(401, getCorsHeaders());
    res.end(JSON.stringify({ mesaj: 'Token lipsă' }));
    return;
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      res.writeHead(403, getCorsHeaders());
      res.end(JSON.stringify({ mesaj: 'Token invalid' }));
      return;
    }

    if (decoded.role === 'guest' && req.method !== 'GET') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ mesaj: 'Doar citire pentru vizitatori' }));
      return;
    }

    callback(decoded);
  });
}

module.exports = {
  verifyToken
};