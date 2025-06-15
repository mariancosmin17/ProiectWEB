function openRSSFeed() {
  const rssUrl = '/api/rss/top10';
  window.open(rssUrl, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('rss-feed-btn')?.addEventListener('click', openRSSFeed);
});
