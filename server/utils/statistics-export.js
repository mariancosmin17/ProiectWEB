const { getAllStats } = require('./statistics-manager');

function getFilename(extension) {
  return `statistici-${new Date().toISOString().split('T')[0]}.${extension}`;
}

async function exportStatsToCSV() {
  try {
    const stats = await getAllStats();
    
    const rows = [
      'Categorie,Valoare',
      `Total Abrevieri,${stats.general.total_abrevieri}`,
      `Total Autori,${stats.general.total_autori}`,
      `Total Domenii,${stats.general.total_domenii}`,
      `Total Limbi,${stats.general.total_limbi}`,
      '',
      'Domeniu,Numar Abrevieri,Procent',
      ...stats.domenii.map(d => `${d.domeniu},${d.count},${d.percentage}%`)
    ];
    
    return {
      succes: true,
      content: rows.join('\n'),
      filename: getFilename('csv')
    };
  } catch (error) {
    return { succes: false, error: error.message };
  }
}

async function exportStatsToPDF() {
  try {
    const stats = await getAllStats();
    
    const statsBoxes = Object.entries({
      'Total Abrevieri': stats.general.total_abrevieri,
      'Total Autori': stats.general.total_autori,
      'Total Domenii': stats.general.total_domenii,
      'Total Limbi': stats.general.total_limbi
    }).map(([label, value]) => 
      `<div class="stat-box"><div class="stat-number">${value}</div><div>${label}</div></div>`
    ).join('');
    
    const tableRows = stats.domenii.map(d => 
      `<tr><td>${d.domeniu}</td><td>${d.count}</td><td>${d.percentage}%</td></tr>`
    ).join('');
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Raport Statistici</title>
  <style>
    body{font-family:Arial;margin:20px}
    h1{color:#0039a6}
    table{width:100%;border-collapse:collapse;margin:20px 0}
    th,td{border:1px solid #ddd;padding:8px}
    th{background:#f2f2f2}
    .stats-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin:20px 0}
    .stat-box{border:1px solid #ddd;padding:15px;text-align:center}
    .stat-number{font-size:24px;font-weight:bold;color:#0039a6}
  </style>
</head>
<body>
  <h1>Raport Statistici Abrevieri</h1>
  <p>Generat pe: ${new Date().toLocaleDateString('ro-RO')}</p>
  <h2>Statistici Generale</h2>
  <div class="stats-grid">${statsBoxes}</div>
  <h2>Distribuția pe Domenii</h2>
  <table>
    <tr><th>Domeniu</th><th>Număr Abrevieri</th><th>Procent</th></tr>
    ${tableRows}
  </table>
</body>
</html>`;
    
    return {
      succes: true,
      content: html,
      filename: getFilename('html')
    };
  } catch (error) {
    return { succes: false, error: error.message };
  }
}

module.exports = {
  exportStatsToCSV,
  exportStatsToPDF
};
