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
}

async function showClassment() {
  try {
    const response = await fetch('http://localhost:8080/api/abrevieri/top10', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt')}` }
    });
    const top10 = await response.json();
    
    const htmlContent = generateClassmentHTML(top10);
    createClassmentModal(htmlContent);
    
  } catch (error) {
    console.error('❌ Eroare clasament:', error);
    alert('Eroare la încărcarea clasamentului');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('vezi-clasament-btn')?.addEventListener('click', showClassment);
});
