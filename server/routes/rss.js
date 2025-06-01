const cacheManager = require('../utils/cache-manager');
const { generateRSSXML } = require('../utils/rss-generator');

function handleRSSRoutes(req, res, parsedUrl) {
  if (req.method === 'GET' && parsedUrl.pathname === '/api/rss/top10') {
    handleTop10RSS(req, res);
    return true;
  }
  
  return false;
}

async function handleTop10RSS(req, res) {
  try {
    const top10 = await cacheManager.getTop10();
    const rssXml = generateRSSXML(top10);
    
    res.writeHead(200, {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(rssXml);
  } catch (error) {
    console.error('❌ Eroare RSS:', error);
    res.writeHead(500);
    res.end('Eroare RSS');
  }
}

module.exports = { handleRSSRoutes };
