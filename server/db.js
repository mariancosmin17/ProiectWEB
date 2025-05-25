const sqlite3 = require('sqlite3').verbose();
const { DB_PATH } = require('./config');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Eroare la conectarea la baza de date:', err.message);
    return;
  }
  console.log('✔️ Conectat la baza de date SQLite');
});

module.exports = db;