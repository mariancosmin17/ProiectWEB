function openRSSFeed() {
  const rssUrl = 'http://localhost:8080/api/rss/top10';
  window.open(rssUrl, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('rss-feed-btn')?.addEventListener('click', openRSSFeed);
});
