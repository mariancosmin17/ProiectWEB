const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const url = require('url');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('❌ Eroare la conectarea la baza de date:', err.message);
    return;
  }
  console.log('✔️ Conectat la baza de date SQLite');
});

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

if (req.method === 'OPTIONS') {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end();
  return;
}

 else if (req.method === 'GET' && parsedUrl.pathname === '/api/abrevieri') {
    db.all('SELECT * FROM abrevieri', [], (err, rows) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Eroare la interogare DB' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rows));
    });

  } 
  
  else if (req.method === 'POST' && parsedUrl.pathname === '/api/login') {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const data = JSON.parse(body);
    const { username, parola } = data;

    db.get('SELECT * FROM utilizatori WHERE username = ?', [username], (err, user) => {
  if (err) {
    res.writeHead(500, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ succes: false, mesaj: 'Eroare server' }));
    return;
  }

  if (!user) {
    res.writeHead(401, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ succes: false, mesaj: 'User inexistent' }));
    return;
  }

  bcrypt.compare(parola, user.parola, (err, rezultat) => {
    if (rezultat) {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ succes: true }));
    } else {
      res.writeHead(401, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ succes: false, mesaj: 'Parolă greșită' }));
    }
  });
});

  });
}

else if (req.method === 'POST' && parsedUrl.pathname === '/api/register') {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const data = JSON.parse(body);
    const { username, parola } = data;

    bcrypt.hash(parola, SALT_ROUNDS, (err, hash) => {
  if (err) {
    res.writeHead(500, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ succes: false, mesaj: 'Eroare la criptare parolă' }));
    return;
  }

  db.run('INSERT INTO utilizatori (username, parola) VALUES (?, ?)', [username, hash], function (err) {
    if (err) {
      res.writeHead(400, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ succes: false, mesaj: 'Utilizatorul există deja sau eroare.' }));
      return;
    }

    res.writeHead(201, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ succes: true }));
  });
});

  });
}

else if (req.method === 'POST' && parsedUrl.pathname === '/api/forgot') {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const data = JSON.parse(body);
    const { username, parolaNoua } = data;

    bcrypt.hash(parolaNoua, SALT_ROUNDS, (err, hashNou) => {
      if (err) {
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ succes: false, mesaj: 'Eroare la criptare parolă' }));
        return;
      }

      db.run('UPDATE utilizatori SET parola = ? WHERE username = ?', [hashNou, username], function (err) {
        if (err || this.changes === 0) {
          res.writeHead(400, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ succes: false, mesaj: 'Utilizator inexistent sau eroare' }));
          return;
        }

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ succes: true }));
      });
    });
  });
}

  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }

});

server.listen(8080, () => {
  console.log('🚀 Server Node.js pornit pe http://localhost:8080');
});
