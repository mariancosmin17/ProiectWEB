const fs = require('fs');
const { promisify } = require('util');
const { DOCBOOK_PATH } = require('../config');

const readFile = promisify(fs.readFile);

function parseXmlForExport(xmlContent) {
  const glossaryMatch = xmlContent.match(/<glossary[^>]*>([\s\S]*?)<\/glossary>/);
  if (!glossaryMatch) return [];
  
  const glossaryContent = glossaryMatch[1];
  const entriesMatches = [...glossaryContent.matchAll(/<glossentry xml:id="([^"]*)">([\s\S]*?)<\/glossentry>/g)];
  
  return entriesMatches.map(match => {
    const content = match[2];
    const abreviere = extractContent(content, 'glossterm');
    const semnificatie = extractContent(content, 'para');
    
    return { abreviere, semnificatie };
  });
}

function extractContent(content, tag) {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'g');
  const match = regex.exec(content);
  return match ? match[1].trim() : '';
}

async function exportToHtml() {
  try {
    const xmlContent = await readFile(DOCBOOK_PATH, 'utf8');
    const abrevieri = parseXmlForExport(xmlContent);
    
    let html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Export Abrevieri</title>
</head>
<body>
  <h1>Glosar de Abrevieri</h1>
  <dl>
`;
    
    abrevieri.forEach(item => {
      html += `    <dt>${item.abreviere}</dt>
    <dd>${item.semnificatie}</dd>
`;
    });
    
    html += `  </dl>
</body>
</html>`;
    
    return {
      succes: true,
      content: html,
      filename: `abrevieri-${new Date().toISOString().split('T')[0]}.html`
    };
  } catch (error) {
    return { succes: false, error: error.message };
  }
}

async function exportToMarkdown() {
  try {
    const xmlContent = await readFile(DOCBOOK_PATH, 'utf8');
    const abrevieri = parseXmlForExport(xmlContent);
    
    let markdown = `# Glosar de Abrevieri

`;
    
    abrevieri.forEach(item => {
      markdown += `## ${item.abreviere}
${item.semnificatie}

`;
    });
    
    return {
      succes: true,
      content: markdown,
      filename: `abrevieri-${new Date().toISOString().split('T')[0]}.md`
    };
  } catch (error) {
    return { succes: false, error: error.message };
  }
}

module.exports = {
  exportToHtml,
  exportToMarkdown
};
