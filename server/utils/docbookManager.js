const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Transformăm funcțiile fs în promisiuni pentru a evita callback hell
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);

// Calea către fișierul XML DocBook
const DOCBOOK_PATH = path.join(__dirname, '../data/abrevieri.xml');
const DOCBOOK_DIRECTORY = path.dirname(DOCBOOK_PATH);

// Asigurăm că directorul pentru fișierul XML există
function ensureDirectoryExists() {
  if (!fs.existsSync(DOCBOOK_DIRECTORY)) {
    fs.mkdirSync(DOCBOOK_DIRECTORY, { recursive: true });
  }
}

// Verifică dacă fișierul XML există, dacă nu, creează-l
async function initializeDocBook() {
  try {
    await access(DOCBOOK_PATH);
  } catch (error) {
    // Fișierul nu există, îl creăm cu structura inițială
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

// Parsare simplă XML (fără biblioteci externe)
function parseXml(xmlContent) {
  // Această funcție parseaza un XML simplu în format text
  // Într-o aplicație reală, ar trebui folosit un parser XML real
  
  // Extragem elementele glossentry
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

// Extrage conținutul dintre tag-uri
function extractTagContent(content, tag, index = 0) {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'g');
  const matches = [...content.matchAll(regex)];
  return matches[index] ? matches[index][1].trim() : '';
}

// Generează XML din datele furnizate
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

// Escapare caractere speciale XML
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Citește toate abrevierile din fișierul XML
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

// Citește o abreviere după ID
async function getAbreviereById(id) {
  try {
    const entries = await getAbrevieri();
    return entries.find(entry => entry.id === id.toString()) || null;
  } catch (error) {
    console.error(`❌ Eroare la căutarea abrevierii cu id=${id}:`, error);
    return null;
  }
}

// Adaugă o abreviere nouă
async function addAbreviere(abreviereData) {
  try {
    const { abreviere, semnificatie, limba, domeniu, autor } = abreviereData;
    
    // Validare date
    if (!abreviere || !semnificatie || !limba || !domeniu) {
      throw new Error('Toate câmpurile sunt obligatorii!');
    }
    
    // Citim abrevierile existente
    const entries = await getAbrevieri();
    
    // Generăm un ID unic
    const newId = entries.length > 0 
      ? Math.max(...entries.map(e => parseInt(e.id))) + 1 
      : 1;
    
    // Creăm noua abreviere
    const newEntry = {
      id: newId.toString(),
      abreviere,
      semnificatie,
      limba,
      domeniu,
      autor: autor || 'necunoscut',
      data_adaugare: new Date().toISOString().split('T')[0]
    };
    
    // Adăugăm la listă și salvăm
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

// Actualizează o abreviere existentă
async function updateAbreviere(id, abreviereData) {
  try {
    const { abreviere, semnificatie, limba, domeniu } = abreviereData;
    
    // Validare date
    if (!abreviere || !semnificatie || !limba || !domeniu) {
      throw new Error('Toate câmpurile sunt obligatorii!');
    }
    
    // Citim abrevierile existente
    const entries = await getAbrevieri();
    const index = entries.findIndex(entry => entry.id === id.toString());
    
    if (index === -1) {
      return { 
        succes: false, 
        mesaj: 'Abrevierea nu a fost găsită.' 
      };
    }
    
    // Actualizăm abrevierea
    entries[index] = {
      ...entries[index],
      abreviere,
      semnificatie,
      limba,
      domeniu
    };
    
    // Salvăm modificările
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

// Șterge o abreviere
async function deleteAbreviere(id) {
  try {
    // Citim abrevierile existente
    const entries = await getAbrevieri();
    const initialLength = entries.length;
    
    // Filtrăm abrevierea care trebuie ștearsă
    const filteredEntries = entries.filter(entry => entry.id !== id.toString());
    
    if (filteredEntries.length === initialLength) {
      return { 
        succes: false, 
        mesaj: 'Abrevierea nu a fost găsită.' 
      };
    }
    
    // Salvăm modificările
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

// Filtrează abrevierile după autor
async function getAbrevieriByAutor(autor) {
  try {
    const entries = await getAbrevieri();
    return entries.filter(entry => entry.autor === autor);
  } catch (error) {
    console.error(`❌ Eroare la filtrarea abrevierilor pentru autorul ${autor}:`, error);
    return [];
  }
}

// Exportăm funcțiile
module.exports = {
  initializeDocBook,
  getAbrevieri,
  getAbreviereById,
  addAbreviere,
  updateAbreviere,
  deleteAbreviere,
  getAbrevieriByAutor
};
