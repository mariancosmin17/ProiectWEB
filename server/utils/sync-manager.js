const fs = require('fs');
const { promisify } = require('util');
const { db } = require('./database-schema');
const { DOCBOOK_PATH } = require('../config');

const writeFile = promisify(fs.writeFile);
const dbAll = promisify(db.all.bind(db));
const dbRun = promisify(db.run.bind(db));

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function syncToXml() {
  try {
    
    const abrevieri = await dbAll('SELECT * FROM abrevieri ORDER BY id');
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<glossary xmlns="http://docbook.org/ns/docbook" version="5.0">
  <title>Glosar de Abrevieri</title>
`;
    
    abrevieri.forEach(entry => {
      xml += `  <glossentry xml:id="${entry.id}">
    <glossterm>${escapeXml(entry.abreviere)}</glossterm>
    <glossdef>
      <para>${escapeXml(entry.semnificatie)}</para>
      <remark>Limba: ${escapeXml(entry.limba)}</remark>
      <remark>Domeniu: ${escapeXml(entry.domeniu)}</remark>
      <remark>Autor: ${escapeXml(entry.autor)}</remark>
      <date>${entry.data_adaugare}</date>
    </glossdef>
  </glossentry>
`;
    });
    
    xml += `</glossary>`;
    
    await writeFile(DOCBOOK_PATH, xml, 'utf8');
    
    await dbRun("UPDATE sync_log SET sync_status = 'completed' WHERE sync_status = 'pending'");
    
    return true;
    
  } catch (error) {
    console.error('❌ Eroare sincronizare:', error);
    return false;
  }
}

setInterval(() => {
  syncToXml();
}, 5000);

module.exports = {
  syncToXml
};
