const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const url = require('url');

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

    db.get('SELECT * FROM utilizatori WHERE username = ? AND parola = ?', [username, parola], (err, user) => {
      if (err) {
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ succes: false, mesaj: 'Eroare server' }));
        return;
      }

      if (user) {
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
        res.end(JSON.stringify({ succes: false }));
      }
    });
  });
}

else if (req.method === 'POST' && parsedUrl.pathname === '/api/register') {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const data = JSON.parse(body);
    const { username, parola } = data;

    db.run('INSERT INTO utilizatori (username, parola) VALUES (?, ?)', [username, parola], function (err) {
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
}

  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }

});

server.listen(8080, () => {
  console.log('🚀 Server Node.js pornit pe http://localhost:8080');
});
