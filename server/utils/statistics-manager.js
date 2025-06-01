const fs = require('fs');
const { DOCBOOK_PATH } = require('../config');

async function parseStats() {
  try {
    const xml = fs.readFileSync(DOCBOOK_PATH, 'utf8');
    const entries = [...xml.matchAll(/<glossentry[^>]*>([\s\S]*?)<\/glossentry>/g)];
    
    return entries.map(match => {
      const content = match[1];
      return {
        limba: content.match(/Limba: ([^<]*)/)?.[1] || '',
        domeniu: content.match(/Domeniu: ([^<]*)/)?.[1] || '',
        autor: content.match(/Autor: ([^<]*)/)?.[1] || ''
      };
    });
  } catch (error) {
    console.error('❌ Eroare statistici:', error);
    return [];
  }
}

async function getAllStats() {
  const data = await parseStats();
  
  const autori = new Set(data.map(d => d.autor).filter(Boolean));
  const domenii = new Set(data.map(d => d.domeniu).filter(Boolean));
  const limbi = new Set(data.map(d => d.limba).filter(Boolean));
  
  const domeniiCount = {};
  data.forEach(d => {
    if (d.domeniu) domeniiCount[d.domeniu] = (domeniiCount[d.domeniu] || 0) + 1;
  });
  
  return {
    general: {
      total_abrevieri: data.length,
      total_autori: autori.size,
      total_domenii: domenii.size,
      total_limbi: limbi.size
    },
    domenii: Object.entries(domeniiCount).map(([domeniu, count]) => ({
      domeniu,
      count,
      percentage: ((count / data.length) * 100).toFixed(1)
    }))
  };
}
async function getUserDomainCoverage(userId) {
  try {
    const xml = fs.readFileSync(DOCBOOK_PATH, 'utf8');
    const entries = [...xml.matchAll(/<glossentry[^>]*>([\s\S]*?)<\/glossentry>/g)];

    const totalDomenii = new Set();
    const domeniiUser = new Set();

    for (const match of entries) {
      const content = match[1];
      const domeniu = content.match(/Domeniu: ([^<]*)/)?.[1]?.trim();
      const autor = content.match(/Autor: ([^<]*)/)?.[1]?.trim();

      if (domeniu) totalDomenii.add(domeniu);
      if (autor === userId?.toString() && domeniu) domeniiUser.add(domeniu);
    }

    const total = totalDomenii.size;
    const user = domeniiUser.size;

    return total > 0 ? ((user / total) * 100).toFixed(1) : '0.0';
  } catch (error) {
    console.error('❌ Eroare coverage:', error);
    return '0.0';
  }
}

module.exports = { getAllStats, getUserDomainCoverage };



