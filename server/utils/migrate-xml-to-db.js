const { createHybridTables, checkTablesExist, db } = require('./database-schema');
const docbookManager = require('./docbookManager');

// Migrează datele din XML în baza de date
async function migrateXmlToDatabase() {
  try {
    console.log('🚀 Începe migrarea datelor din XML în baza de date...');
    
    // 1. Verifică și creează tabelele dacă nu există
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      await createHybridTables();
    }
    
    // 2. Încarcă abrevierile din XML
    console.log('📖 Încarcă datele din XML...');
    const abrevieri = await docbookManager.getAbrevieri();
    console.log(`📊 Găsite ${abrevieri.length} abrevieri în XML`);
    
    // 3. Verifică dacă baza de date este goală
    const count = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM abrevieri', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    if (count > 0) {
      console.log(`⚠️  Baza de date conține deja ${count} abrevieri. Migrarea va fi sărită.`);
      return { succes: true, mesaj: 'Migrarea nu este necesară', abrevieri_existente: count };
    }
    
    // 4. Inserează abrevierile în baza de date
    console.log('💾 Inserez abrevierile în baza de date...');
    let inserateSucces = 0;
    let erori = 0;
    
    for (const abreviere of abrevieri) {
      try {
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO abrevieri (
              id, abreviere, semnificatie, limba, domeniu, autor, data_adaugare
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            parseInt(abreviere.id),
            abreviere.abreviere,
            abreviere.semnificatie,
            abreviere.limba,
            abreviere.domeniu,
            abreviere.autor,
            abreviere.data_adaugare
          ], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });
        
        inserateSucces++;
        console.log(`✅ Abreviere "${abreviere.abreviere}" inserată cu succes`);
        
      } catch (error) {
        erori++;
        console.error(`❌ Eroare la inserarea abrevierii "${abreviere.abreviere}":`, error.message);
      }
    }
    
    console.log(`🎉 Migrare completă! ${inserateSucces} abrevieri inserate, ${erori} erori`);
    
    return {
      succes: true,
      mesaj: 'Migrare completă cu succes',
      abrevieri_migrite: inserateSucces,
      erori: erori
    };
    
  } catch (error) {
    console.error('💥 Eroare fatală în timpul migrării:', error);
    return {
      succes: false,
      mesaj: 'Eroare în timpul migrării',
      error: error.message
    };
  }
}

module.exports = {
  migrateXmlToDatabase
};
