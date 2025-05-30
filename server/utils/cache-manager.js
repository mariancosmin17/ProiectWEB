const { db } = require('./database-schema');
const { promisify } = require('util');

// Transformăm operațiunile SQLite în promisiuni
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));
const dbRun = promisify(db.run.bind(db));

// Adaugă o înregistrare în log-ul de sincronizare
async function addSyncLog(operation, recordId = null, error = null) {
  try {
    await dbRun(`
      INSERT INTO sync_log (operation, table_name, record_id, sync_status, error_message)
      VALUES (?, 'abrevieri', ?, ?, ?)
    `, [operation, recordId, error ? 'error' : 'pending', error]);
  } catch (err) {
    console.error('❌ Eroare la adăugarea în sync_log:', err);
  }
}

// Obține toate abrevierile (foarte rapid din baza de date)
async function getAbrevieri() {
  try {
    const abrevieri = await dbAll(`
      SELECT id, abreviere, semnificatie, limba, domeniu, autor, data_adaugare, version
      FROM abrevieri 
      ORDER BY id ASC
    `);
    
    // Convertește în formatul așteptat
    return abrevieri.map(row => ({
      id: row.id.toString(),
      abreviere: row.abreviere,
      semnificatie: row.semnificatie,
      limba: row.limba,
      domeniu: row.domeniu,
      autor: row.autor,
      data_adaugare: row.data_adaugare,
      version: row.version
    }));
  } catch (error) {
    console.error('❌ Eroare la citirea abrevierilor din cache:', error);
    return [];
  }
}

// Obține o abreviere după ID
async function getAbreviereById(id) {
  try {
    const abreviere = await dbGet(`
      SELECT id, abreviere, semnificatie, limba, domeniu, autor, data_adaugare, version
      FROM abrevieri 
      WHERE id = ?
    `, [parseInt(id)]);
    
    if (!abreviere) return null;
    
    return {
      id: abreviere.id.toString(),
      abreviere: abreviere.abreviere,
      semnificatie: abreviere.semnificatie,
      limba: abreviere.limba,
      domeniu: abreviere.domeniu,
      autor: abreviere.autor,
      data_adaugare: abreviere.data_adaugare,
      version: abreviere.version
    };
  } catch (error) {
    console.error(`❌ Eroare la căutarea abrevierii cu id=${id}:`, error);
    return null;
  }
}

// Adaugă o abreviere nouă
async function addAbreviere(abreviereData) {
  try {
    const { abreviere, semnificatie, limba, domeniu, autor } = abreviereData;
    
    // Validare
    if (!abreviere || !semnificatie || !limba || !domeniu) {
      throw new Error('Toate câmpurile sunt obligatorii!');
    }
    
    // Obține următorul ID disponibil
    const result = await dbGet('SELECT MAX(id) as maxId FROM abrevieri');
    const newId = (result.maxId || 0) + 1;
    
    // Inserează în baza de date
    await dbRun(`
      INSERT INTO abrevieri (
        id, abreviere, semnificatie, limba, domeniu, autor, data_adaugare, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      newId,
      abreviere,
      semnificatie,
      limba,
      domeniu,
      autor || 'necunoscut',
      new Date().toISOString().split('T')[0]
    ]);
    
    // Adaugă în log pentru sincronizare cu XML
    await addSyncLog('CREATE', newId);
    
    console.log(`✅ Abreviere "${abreviere}" adăugată în cache cu ID ${newId}`);
    
    return { 
      succes: true, 
      mesaj: 'Abreviere adăugată cu succes!',
      id: newId 
    };
  } catch (error) {
    console.error('❌ Eroare la adăugarea abrevierii în cache:', error);
    await addSyncLog('CREATE', null, error.message);
    
    return { 
      succes: false, 
      mesaj: error.message || 'Eroare la adăugarea abrevierii.' 
    };
  }
}

// Actualizează o abreviere (cu optimistic locking)
async function updateAbreviere(id, abreviereData, expectedVersion = null) {
  try {
    const { abreviere, semnificatie, limba, domeniu } = abreviereData;
    
    // Validare
    if (!abreviere || !semnificatie || !limba || !domeniu) {
      throw new Error('Toate câmpurile sunt obligatorii!');
    }
    
    // Verifică dacă abrevierea există
    const existing = await getAbreviereById(id);
    if (!existing) {
      return { 
        succes: false, 
        mesaj: 'Abrevierea nu a fost găsită.' 
      };
    }
    
    // Optimistic locking (dacă este specificată versiunea)
    let updateQuery = `
      UPDATE abrevieri 
      SET abreviere = ?, semnificatie = ?, limba = ?, domeniu = ?, 
          version = version + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    let updateParams = [abreviere, semnificatie, limba, domeniu, parseInt(id)];
    
    if (expectedVersion !== null) {
      updateQuery += ' AND version = ?';
      updateParams.push(expectedVersion);
    }
    
    const result = await dbRun(updateQuery, updateParams);
    
    if (result.changes === 0) {
      if (expectedVersion !== null) {
        return {
          succes: false,
          mesaj: 'Abrevierea a fost modificată de altcineva. Te rog reîmprospătează pagina.'
        };
      } else {
        return {
          succes: false,
          mesaj: 'Abrevierea nu a fost găsită.'
        };
      }
    }
    
    // Adaugă în log pentru sincronizare
    await addSyncLog('UPDATE', parseInt(id));
    
    console.log(`✅ Abreviere cu ID ${id} actualizată în cache`);
    
    return { 
      succes: true, 
      mesaj: 'Abreviere actualizată cu succes!' 
    };
  } catch (error) {
    console.error(`❌ Eroare la actualizarea abrevierii cu id=${id}:`, error);
    await addSyncLog('UPDATE', parseInt(id), error.message);
    
    return { 
      succes: false, 
      mesaj: error.message || 'Eroare la actualizarea abrevierii.' 
    };
  }
}

// Șterge o abreviere
async function deleteAbreviere(id) {
  try {
    // Verifică dacă abrevierea există
    const existing = await getAbreviereById(id);
    if (!existing) {
      return { 
        succes: false, 
        mesaj: 'Abrevierea nu a fost găsită.' 
      };
    }
    
    // Șterge din baza de date
    const result = await dbRun('DELETE FROM abrevieri WHERE id = ?', [parseInt(id)]);
    
    if (result.changes === 0) {
      return { 
        succes: false, 
        mesaj: 'Abrevierea nu a fost găsită.' 
      };
    }
    
    // Adaugă în log pentru sincronizare
    await addSyncLog('DELETE', parseInt(id));
    
    console.log(`✅ Abreviere cu ID ${id} ștearsă din cache`);
    
    return { 
      succes: true, 
      mesaj: 'Abreviere ștearsă cu succes!' 
    };
  } catch (error) {
    console.error(`❌ Eroare la ștergerea abrevierii cu id=${id}:`, error);
    await addSyncLog('DELETE', parseInt(id), error.message);
    
    return { 
      succes: false, 
      mesaj: 'Eroare la ștergerea abrevierii.' 
    };
  }
}

// Filtrează abrevierile după autor (foarte rapid cu index)
async function getAbrevieriByAutor(autor) {
  try {
    const abrevieri = await dbAll(`
      SELECT id, abreviere, semnificatie, limba, domeniu, autor, data_adaugare, version
      FROM abrevieri 
      WHERE autor = ?
      ORDER BY id ASC
    `, [autor]);
    
    return abrevieri.map(row => ({
      id: row.id.toString(),
      abreviere: row.abreviere,
      semnificatie: row.semnificatie,
      limba: row.limba,
      domeniu: row.domeniu,
      autor: row.autor,
      data_adaugare: row.data_adaugare,
      version: row.version
    }));
  } catch (error) {
    console.error(`❌ Eroare la filtrarea abrevierilor pentru ${autor}:`, error);
    return [];
  }
}

// Căutare rapidă în abrevieri
async function searchAbrevieri(searchTerm) {
  try {
    const abrevieri = await dbAll(`
      SELECT id, abreviere, semnificatie, limba, domeniu, autor, data_adaugare, version
      FROM abrevieri 
      WHERE abreviere LIKE ? OR semnificatie LIKE ?
      ORDER BY id ASC
    `, [`%${searchTerm}%`, `%${searchTerm}%`]);
    
    return abrevieri.map(row => ({
      id: row.id.toString(),
      abreviere: row.abreviere,
      semnificatie: row.semnificatie,
      limba: row.limba,
      domeniu: row.domeniu,
      autor: row.autor,
      data_adaugare: row.data_adaugare,
      version: row.version
    }));
  } catch (error) {
    console.error(`❌ Eroare la căutarea abrevierilor:`, error);
    return [];
  }
}

module.exports = {
  getAbrevieri,
  getAbreviereById,
  addAbreviere,
  updateAbreviere,
  deleteAbreviere,
  getAbrevieriByAutor,
  searchAbrevieri,
  addSyncLog
};
