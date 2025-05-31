let domeniiChart = null;

document.addEventListener('DOMContentLoaded', async () => {

  const statsLink = document.querySelector('.nav-link[data-section="statistics"]');
  
  statsLink.addEventListener('click', async () => {
    await loadStatistics();
  });
  
  document.getElementById('export-stats-csv')?.addEventListener('click', () => exportStats('csv'));
  document.getElementById('export-stats-pdf')?.addEventListener('click', () => exportStats('pdf'));
});

async function loadStatistics() {
  const token = localStorage.getItem('jwt');
  if (!token) return;
  
  try {
    const response = await fetch('http://localhost:8080/api/statistics', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    const data = await response.json();
    
    document.getElementById('stat-total').textContent = data.general.total_abrevieri;
    document.getElementById('stat-autori').textContent = data.general.total_autori;
    document.getElementById('stat-domenii').textContent = data.general.total_domenii;
    document.getElementById('stat-limbi').textContent = data.general.total_limbi;
    
    createDomeniiChart(data.domenii);
    
  } catch (error) {
    console.error('Eroare la încărcarea statisticilor:', error);
  }
}

function createDomeniiChart(domeniiData) {
  const ctx = document.getElementById('domenii-chart');
  
  if (domeniiChart) {
    domeniiChart.destroy();
  }
  
  domeniiChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: domeniiData.map(d => d.domeniu),
      datasets: [{
        data: domeniiData.map(d => d.count),
        backgroundColor: ['#0039a6', '#00BFFF', '#32CD32', '#FFD700', '#FF6347']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function exportStats(format) {
  console.log(`Export statistici în format ${format} - va fi implementat în etapa următoare`);
}
