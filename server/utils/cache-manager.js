const { db } = require('./database-schema');
const { promisify } = require('util');

const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));
const dbRun = promisify(db.run.bind(db));

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

async function getAbrevieri() {
  try {
    const abrevieri = await dbAll(`
      SELECT id, abreviere, semnificatie, limba, domeniu, autor, data_adaugare, version
      FROM abrevieri 
      ORDER BY id ASC
    `);
    
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

async function addAbreviere(abreviereData) {
  try {
    const { abreviere, semnificatie, limba, domeniu, autor } = abreviereData;
    
    
    if (!abreviere || !semnificatie || !limba || !domeniu) {
      throw new Error('Toate câmpurile sunt obligatorii!');
    }
    
    const result = await dbGet('SELECT MAX(id) as maxId FROM abrevieri');
    const newId = (result.maxId || 0) + 1;
    
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

async function updateAbreviere(id, abreviereData, expectedVersion = null) {
  try {
    const { abreviere, semnificatie, limba, domeniu } = abreviereData;
    
    if (!abreviere || !semnificatie || !limba || !domeniu) {
      throw new Error('Toate câmpurile sunt obligatorii!');
    }
    
    const existing = await getAbreviereById(id);
    if (!existing) {
      return { 
        succes: false, 
        mesaj: 'Abrevierea nu a fost găsită.' 
      };
    }
    
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
    
    await dbRun(updateQuery, updateParams);
    
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

async function deleteAbreviere(id) {
  try {
    const existing = await getAbreviereById(id);
    
    if (!existing) {
      return { 
        succes: false, 
        mesaj: 'Abrevierea nu a fost găsită.' 
      };
    }
    
    await dbRun('DELETE FROM abrevieri WHERE id = ?', [parseInt(id)]);

    const stillExists = await getAbreviereById(id);

    if (stillExists) {
      return { 
        succes: false, 
        mesaj: 'Eroare la ștergerea abrevierii.' 
      };
    }
    
    await addSyncLog('DELETE', parseInt(id));
    
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

let syncStarted = false;

function startAutoSync() {
  if (syncStarted) return;
  syncStarted = true;
  
  console.log('🚀 Pornesc sincronizarea automată cache → XML...');
  
  const syncManager = require('./sync-manager');
}

async function incrementViews(id) {
  try {
    
    const existing = await getAbreviereById(id);
    if (!existing) {
      return { 
        succes: false, 
        mesaj: 'Abrevierea nu a fost găsită.' 
      };
    }
    
    await dbRun(`
      UPDATE abrevieri 
      SET views_count = COALESCE(views_count, 0) + 1 
      WHERE id = ?
    `, [parseInt(id)]);
    
    await addSyncLog('VIEW', parseInt(id));
      
    return { 
      succes: true, 
      mesaj: 'Vizualizare înregistrată' 
    };
  } catch (error) {
    console.error(`❌ Eroare la incrementarea views pentru id=${id}:`, error);
    return { 
      succes: false, 
      mesaj: 'Eroare la înregistrarea vizualizării.' 
    };
  }
}

startAutoSync();

module.exports = {
  getAbrevieri,
  getAbreviereById,
  addAbreviere,
  updateAbreviere,
  deleteAbreviere,
  getAbrevieriByAutor,
  searchAbrevieri,
  addSyncLog,
  incrementViews
};
