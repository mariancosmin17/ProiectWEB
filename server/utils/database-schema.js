const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { DB_PATH } = require('../config');

const db = new sqlite3.Database(DB_PATH);

async function createHybridTables() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Creez tabelele pentru arhitectura hibridă...');
    
    db.serialize(() => {
      
      db.run(`
        CREATE TABLE IF NOT EXISTS abrevieri (
          id INTEGER PRIMARY KEY,
          abreviere TEXT NOT NULL,
          semnificatie TEXT NOT NULL,
          limba TEXT NOT NULL,
          domeniu TEXT NOT NULL,
          autor TEXT NOT NULL,
          data_adaugare DATE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          version INTEGER DEFAULT 1
        )
      `, (err) => {
        if (err) {
          console.error('❌ Eroare la crearea tabelei abrevieri:', err);
          return reject(err);
        }
        console.log('✅ Tabela abrevieri creată cu succes');
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS sync_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          operation TEXT NOT NULL,
          table_name TEXT NOT NULL,
          record_id INTEGER,
          sync_status TEXT DEFAULT 'pending',
          error_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          synced_at DATETIME
        )
      `, (err) => {
        if (err) {
          console.error('❌ Eroare la crearea tabelei sync_log:', err);
          return reject(err);
        }
        console.log('✅ Tabela sync_log creată cu succes');
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_abrevieri_autor ON abrevieri(autor)
      `, (err) => {
        if (err) console.error('❌ Eroare la crearea indexului pentru autor:', err);
        else console.log('✅ Index pentru autor creat');
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_abrevieri_limba ON abrevieri(limba)
      `, (err) => {
        if (err) console.error('❌ Eroare la crearea indexului pentru limba:', err);
        else console.log('✅ Index pentru limba creat');
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_abrevieri_domeniu ON abrevieri(domeniu)
      `, (err) => {
        if (err) console.error('❌ Eroare la crearea indexului pentru domeniu:', err);
        else console.log('✅ Index pentru domeniu creat');
      });

    
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_abrevieri_search 
        ON abrevieri(abreviere, semnificatie)
      `, (err) => {
        if (err) console.error('❌ Eroare la crearea indexului pentru căutare:', err);
        else console.log('✅ Index pentru căutare creat');
     
        console.log('🎉 Toate tabelele și indexii au fost creați cu succes!');
        resolve();
      });
    });
  });
}

async function checkTablesExist() {
  return new Promise((resolve) => {
    db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='abrevieri'",
      (err, row) => {
        if (err) {
          console.error('❌ Eroare la verificarea tabelelor:', err);
          resolve(false);
        } else {
          resolve(!!row);
        }
      }
    );
  });
}

module.exports = {
  createHybridTables,
  checkTablesExist,
  db
};
