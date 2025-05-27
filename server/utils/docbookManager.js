const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);

const DOCBOOK_PATH = path.join(__dirname, '../data/abrevieri.xml');
const DOCBOOK_DIRECTORY = path.dirname(DOCBOOK_PATH);

function ensureDirectoryExists() {
  if (!fs.existsSync(DOCBOOK_DIRECTORY)) {
    fs.mkdirSync(DOCBOOK_DIRECTORY, { recursive: true });
  }
}

async function initializeDocBook() {
  try {
    await access(DOCBOOK_PATH);
  } catch (error) {

    ensureDirectoryExists();
    
    const initialXml = `<?xml version="1.0" encoding="UTF-8"?>
<glossary xmlns="http://docbook.org/ns/docbook" version="5.0">
  <title>Glosar de Abrevieri</title>
  <!-- Abrevierile vor fi adăugate aici -->
</glossary>`;
    
    await writeFile(DOCBOOK_PATH, initialXml, 'utf8');
    console.log('✔️ Fișierul DocBook a fost creat');
  }
}


function parseXml(xmlContent) {

  const glossaryMatch = xmlContent.match(/<glossary[^>]*>([\s\S]*?)<\/glossary>/);
  if (!glossaryMatch) {
    return { entries: [] };
  }
  
  const glossaryContent = glossaryMatch[1];
  const entriesMatches = [...glossaryContent.matchAll(/<glossentry xml:id="([^"]*)">([\s\S]*?)<\/glossentry>/g)];
  
  const entries = entriesMatches.map(match => {
    const id = match[1];
    const content = match[2];
    
    const abreviere = extractTagContent(content, 'glossterm');
    const semnificatie = extractTagContent(content, 'para');
    const limba = extractTagContent(content, 'remark', 0);
    const domeniu = extractTagContent(content, 'remark', 1);
    const autor = extractTagContent(content, 'remark', 2);
    const dataAdaugare = extractTagContent(content, 'date');
    
    return {
      id,
      abreviere,
      semnificatie,
      limba: limba ? limba.replace('Limba: ', '') : '',
      domeniu: domeniu ? domeniu.replace('Domeniu: ', '') : '',
      autor: autor ? autor.replace('Autor: ', '') : '',
      data_adaugare: dataAdaugare || new Date().toISOString().split('T')[0]
    };
  });
  
  return { entries };
}

function extractTagContent(content, tag, index = 0) {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'g');
  const matches = [...content.matchAll(regex)];
  return matches[index] ? matches[index][1].trim() : '';
}

function generateXml(entries) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<glossary xmlns="http://docbook.org/ns/docbook" version="5.0">
  <title>Glosar de Abrevieri</title>
`;
  
  entries.forEach(entry => {
    xml += `  <glossentry xml:id="${entry.id}">
    <glossterm>${escapeXml(entry.abreviere)}</glossterm>
    <glossdef>
      <para>${escapeXml(entry.semnificatie)}</para>
      <remark>Limba: ${escapeXml(entry.limba)}</remark>
      <remark>Domeniu: ${escapeXml(entry.domeniu)}</remark>
      <remark>Autor: ${escapeXml(entry.autor || 'necunoscut')}</remark>
      <date>${entry.data_adaugare}</date>
    </glossdef>
  </glossentry>
`;
  });
  
  xml += `</glossary>`;
  return xml;
}

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function getAbrevieri() {
  try {
    await initializeDocBook();
    const xmlContent = await readFile(DOCBOOK_PATH, 'utf8');
    const { entries } = parseXml(xmlContent);
    return entries;
  } catch (error) {
    console.error('❌ Eroare la citirea abrevierilor:', error);
    return [];
  }
}

async function getAbreviereById(id) {
  try {
    const entries = await getAbrevieri();
    return entries.find(entry => entry.id === id.toString()) || null;
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
    
    const entries = await getAbrevieri();
    
    const newId = entries.length > 0 
      ? Math.max(...entries.map(e => parseInt(e.id))) + 1 
      : 1;
    
    const newEntry = {
      id: newId.toString(),
      abreviere,
      semnificatie,
      limba,
      domeniu,
      autor: autor || 'necunoscut',
      data_adaugare: new Date().toISOString().split('T')[0]
    };
    
    entries.push(newEntry);
    const xmlContent = generateXml(entries);
    await writeFile(DOCBOOK_PATH, xmlContent, 'utf8');
    
    return { 
      succes: true, 
      mesaj: 'Abreviere adăugată cu succes!',
      id: newId 
    };
  } catch (error) {
    console.error('❌ Eroare la adăugarea abrevierii:', error);
    return { 
      succes: false, 
      mesaj: error.message || 'Eroare la adăugarea abrevierii.' 
    };
  }
}

async function updateAbreviere(id, abreviereData) {
  try {
    const { abreviere, semnificatie, limba, domeniu } = abreviereData;
    
    if (!abreviere || !semnificatie || !limba || !domeniu) {
      throw new Error('Toate câmpurile sunt obligatorii!');
    }
    
    const entries = await getAbrevieri();
    const index = entries.findIndex(entry => entry.id === id.toString());
    
    if (index === -1) {
      return { 
        succes: false, 
        mesaj: 'Abrevierea nu a fost găsită.' 
      };
    }
    
    entries[index] = {
      ...entries[index],
      abreviere,
      semnificatie,
      limba,
      domeniu
    };
    
    const xmlContent = generateXml(entries);
    await writeFile(DOCBOOK_PATH, xmlContent, 'utf8');
    
    return { 
      succes: true, 
      mesaj: 'Abreviere actualizată cu succes!' 
    };
  } catch (error) {
    console.error(`❌ Eroare la actualizarea abrevierii cu id=${id}:`, error);
    return { 
      succes: false, 
      mesaj: error.message || 'Eroare la actualizarea abrevierii.' 
    };
  }
}

async function deleteAbreviere(id) {
  try {

    const entries = await getAbrevieri();
    const initialLength = entries.length;
    
    const filteredEntries = entries.filter(entry => entry.id !== id.toString());
    
    if (filteredEntries.length === initialLength) {
      return { 
        succes: false, 
        mesaj: 'Abrevierea nu a fost găsită.' 
      };
    }
    
    const xmlContent = generateXml(filteredEntries);
    await writeFile(DOCBOOK_PATH, xmlContent, 'utf8');
    
    return { 
      succes: true, 
      mesaj: 'Abreviere ștearsă cu succes!' 
    };
  } catch (error) {
    console.error(`❌ Eroare la ștergerea abrevierii cu id=${id}:`, error);
    return { 
      succes: false, 
      mesaj: 'Eroare la ștergerea abrevierii.' 
    };
  }
}

async function getAbrevieriByAutor(autor) {
  try {
    const entries = await getAbrevieri();
    return entries.filter(entry => entry.autor === autor);
  } catch (error) {
    console.error(`❌ Eroare la filtrarea abrevierilor pentru autorul ${autor}:`, error);
    return [];
  }
}

module.exports = {
  initializeDocBook,
  getAbrevieri,
  getAbreviereById,
  addAbreviere,
  updateAbreviere,
  deleteAbreviere,
  getAbrevieriByAutor
};
