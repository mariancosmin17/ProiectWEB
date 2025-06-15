function generateClassmentHTML(top10) {
  return `
    <div class="modal-content">
      <div class="modal-header">
        <h3>🏆 Top 10 Cele Mai Vizualizate Abrevieri</h3>
        <span class="close-modal">&times;</span>
      </div>
      <div class="clasament-container">
        ${top10.map((item, index) => `
          <div class="clasament-item">
            <span><strong>${index + 1}.</strong> ${item.abreviere} = ${item.semnificatie}</span>
            <span class="clasament-badge">${item.views_count} views</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function createClassmentModal(htmlContent) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = htmlContent;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  modal.style.opacity = '1';
  
  modal.querySelector('.close-modal').onclick = () => document.body.removeChild(modal);
  modal.onclick = (e) => e.target === modal && document.body.removeChild(modal);
  
  return modal;
}

async function fetchTop10() {
  const response = await fetch('/api/abrevieri/top10', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt')}` }
  });
  return response.json();
}

async function updateClassment(modal) {
  try {
    const newTop10 = await fetchTop10();
    const container = modal.querySelector('.clasament-container');
    
    if (container) {
      container.innerHTML = newTop10.map((item, index) => `
        <div class="clasament-item">
          <span><strong>${index + 1}.</strong> ${item.abreviere} = ${item.semnificatie}</span>
          <span class="clasament-badge">${item.views_count} views</span>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('❌ Eroare refresh:', error);
  }
}

async function showClassment() {
  try {
    const top10 = await fetchTop10();
    const htmlContent = generateClassmentHTML(top10);
    const modal = createClassmentModal(htmlContent);
    
    const refreshInterval = setInterval(() => updateClassment(modal), 5000);
    
    const closeBtn = modal.querySelector('.close-modal');
    const originalClose = closeBtn.onclick;
    closeBtn.onclick = () => {
      clearInterval(refreshInterval);
      originalClose();
    };
    
  } catch (error) {
    console.error('❌ Eroare clasament:', error);
    alert('Eroare la încărcarea clasamentului');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('vezi-clasament-btn')?.addEventListener('click', showClassment);
});
