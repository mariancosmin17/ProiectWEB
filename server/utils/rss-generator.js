function generateRSSXML(top10) {
  const items = top10.map(item => `
    <item>
      <title>${item.abreviere} - ${item.semnificatie}</title>
      <description>Limba: ${item.limba}, Domeniu: ${item.domeniu}, Autor: ${item.autor}, Vizualizări: ${item.views_count}</description>
      <guid>${Date.now()}-${item.abreviere}</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Top 10 Abrevieri Populare - APlace</title>
    <description>Cele mai vizualizate 10 abrevieri</description>
    <link></link>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;
}

module.exports = { generateRSSXML };
