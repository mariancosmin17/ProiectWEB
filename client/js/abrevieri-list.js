
const abrevieriListState = {
  allAbrevieri: [], 
  filteredAbrevieri: [], 
  currentPage: 1,
  itemsPerPage: 10,
  filters: {
    search: '',
    limba: '',
    domeniu: '',
    autor: ''
  },
  uniqueValues: {
    limbi: new Set(),
    domenii: new Set(),
    autori: new Set()
  }
};

function viewAbreviere(abreviere) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>📖 ${abreviere.abreviere}</h3>
        <span class="close-modal">&times;</span>
      </div>
      <div style="margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee;">
        <strong style="display: inline-block; width: 100px;">Înseamnă:</strong> ${abreviere.semnificatie}
      </div>
      <div style="margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee;">
        <strong style="display: inline-block; width: 100px;">Limba:</strong> ${abreviere.limba}
      </div>
      <div style="margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee;">
        <strong style="display: inline-block; width: 100px;">Domeniu:</strong> ${abreviere.domeniu}
      </div>
      <div style="margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee;">
        <strong style="display: inline-block; width: 100px;">Autor:</strong> ${abreviere.autor || 'necunoscut'}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  modal.style.opacity = '1';
  
  modal.querySelector('.close-modal').onclick = () => document.body.removeChild(modal);
  modal.onclick = (e) => e.target === modal && document.body.removeChild(modal);
  
  fetch(`/api/abrevieri/${abreviere.id}/view`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
    'Content-Type': 'application/json'
  }
}).catch(err => console.error('Eroare views:', err));
}

async function loadAllAbrevieri() {
  try {
    const token = localStorage.getItem('jwt');
    if (!authUtils.isValidToken(token)) {
      localStorage.removeItem('jwt');
      window.location.href = '../html/login.html';
      return;
    }
    
    const headers = {
      'Authorization': 'Bearer ' + token
    };
    
    const response = await fetch('/api/toate-abrevierile', {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error('Răspuns negativ de la server');
    }

    const abrevieri = await response.json();
    abrevieriListState.allAbrevieri = abrevieri;
    abrevieriListState.filteredAbrevieri = [...abrevieri];
    
    populateUniqueValues(abrevieri);
    populateFilterDropdowns();
    
    renderAbrevieriList();
    initializeSearchAndFilters();
    
    return abrevieri;
  } catch (err) {
    console.error('❌ Eroare la încărcarea tuturor abrevierilor:', err);
    const listaElement = document.getElementById('lista-completa-abrevieri');
    if (listaElement) {
      listaElement.innerHTML = '<li class="error-message">Eroare la încărcarea abrevierilor. Încercați din nou mai târziu.</li>';
      listaElement.classList.remove('loading');
    }
    throw err;
  }
}

function populateUniqueValues(abrevieri) {
  abrevieriListState.uniqueValues.limbi.clear();
  abrevieriListState.uniqueValues.domenii.clear();
  abrevieriListState.uniqueValues.autori.clear();
  
  abrevieri.forEach(item => {
    if (item.limba) abrevieriListState.uniqueValues.limbi.add(item.limba);
    if (item.domeniu) abrevieriListState.uniqueValues.domenii.add(item.domeniu);
    if (item.autor) abrevieriListState.uniqueValues.autori.add(item.autor);
  });
}

function populateFilterDropdowns() {

  const limbaSelect = document.getElementById('filter-limba');
  limbaSelect.innerHTML = '<option value="">Toate</option>';
  
  Array.from(abrevieriListState.uniqueValues.limbi)
    .sort()
    .forEach(limba => {
      const option = document.createElement('option');
      option.value = limba;
      option.textContent = limba;
      limbaSelect.appendChild(option);
    });
  
  const domeniuSelect = document.getElementById('filter-domeniu');
  domeniuSelect.innerHTML = '<option value="">Toate</option>';
  
  Array.from(abrevieriListState.uniqueValues.domenii)
    .sort()
    .forEach(domeniu => {
      const option = document.createElement('option');
      option.value = domeniu;
      option.textContent = domeniu;
      domeniuSelect.appendChild(option);
    });
  
  const autorSelect = document.getElementById('filter-autor');
  autorSelect.innerHTML = '<option value="">Toți</option>';
  
  Array.from(abrevieriListState.uniqueValues.autori)
    .sort()
    .forEach(autor => {
      const option = document.createElement('option');
      option.value = autor;
      option.textContent = autor;
      autorSelect.appendChild(option);
    });
  
  const token = localStorage.getItem('jwt');
  const decoded = authUtils.parseJwt(token);
  const isGuestOrAdmin = decoded?.role === 'guest' || decoded?.role === 'admin';
  
  const autorFilterContainer = document.getElementById('autor-filter-container');
  const autorCol = document.getElementById('autor-col');
  
  if (!isGuestOrAdmin) {
    autorFilterContainer.style.display = 'none';
    autorCol.style.display = 'none';
  } else {
    autorFilterContainer.style.display = 'block';
    autorCol.style.display = 'block';
  }
}

function initializeSearchAndFilters() {

  const searchInput = document.getElementById('search-abrevieri');
  const searchButton = document.getElementById('search-button');
  
  searchInput.addEventListener('input', () => {
    abrevieriListState.filters.search = searchInput.value.toLowerCase();
    abrevieriListState.currentPage = 1;
    applyFilters();
  });
  
  searchButton.addEventListener('click', () => {
    applyFilters();
  });
  
  const limbaFilter = document.getElementById('filter-limba');
  limbaFilter.addEventListener('change', () => {
    abrevieriListState.filters.limba = limbaFilter.value;
    abrevieriListState.currentPage = 1;
    applyFilters();
  });
  
  const domeniuFilter = document.getElementById('filter-domeniu');
  domeniuFilter.addEventListener('change', () => {
    abrevieriListState.filters.domeniu = domeniuFilter.value;
    abrevieriListState.currentPage = 1;
    applyFilters();
  });
  
  const autorFilter = document.getElementById('filter-autor');
  autorFilter.addEventListener('change', () => {
    abrevieriListState.filters.autor = autorFilter.value;
    abrevieriListState.currentPage = 1;
    applyFilters();
  });
  
  const resetButton = document.getElementById('reset-filters');
  resetButton.addEventListener('click', () => {
    searchInput.value = '';
    limbaFilter.value = '';
    domeniuFilter.value = '';
    autorFilter.value = '';
    
    abrevieriListState.filters = {
      search: '',
      limba: '',
      domeniu: '',
      autor: ''
    };
    
    abrevieriListState.currentPage = 1;
    applyFilters();
  });
  
  const prevPageButton = document.getElementById('prev-page');
  const nextPageButton = document.getElementById('next-page');
  
  prevPageButton.addEventListener('click', () => {
    if (abrevieriListState.currentPage > 1) {
      abrevieriListState.currentPage--;
      renderAbrevieriList();
    }
  });
  
  nextPageButton.addEventListener('click', () => {
    const totalPages = Math.ceil(abrevieriListState.filteredAbrevieri.length / abrevieriListState.itemsPerPage);
    if (abrevieriListState.currentPage < totalPages) {
      abrevieriListState.currentPage++;
      renderAbrevieriList();
    }
  });
}

function applyFilters() {
  const { search, limba, domeniu, autor } = abrevieriListState.filters;
  
  abrevieriListState.filteredAbrevieri = abrevieriListState.allAbrevieri.filter(item => {
  
    const searchMatch = search === '' || 
      item.abreviere.toLowerCase().includes(search) || 
      item.semnificatie.toLowerCase().includes(search);

    const limbaMatch = limba === '' || item.limba === limba;
    
    const domeniuMatch = domeniu === '' || item.domeniu === domeniu;

    const autorMatch = autor === '' || item.autor === autor;
    
    return searchMatch && limbaMatch && domeniuMatch && autorMatch;
  });
  
  renderAbrevieriList();
}

function renderAbrevieriList() {
  const listaElement = document.getElementById('lista-completa-abrevieri');
  const noResults = document.getElementById('no-results');
  const pageInfo = document.getElementById('page-info');
  const prevPageButton = document.getElementById('prev-page');
  const nextPageButton = document.getElementById('next-page');
  
  listaElement.innerHTML = '';
  listaElement.classList.remove('loading');
  
  if (abrevieriListState.filteredAbrevieri.length === 0) {
    noResults.classList.remove('hidden');
    pageInfo.textContent = 'Pagina 0 din 0';
    prevPageButton.disabled = true;
    nextPageButton.disabled = true;
    return;
  }
  
  noResults.classList.add('hidden');
  
  const totalItems = abrevieriListState.filteredAbrevieri.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / abrevieriListState.itemsPerPage));
 
  if (abrevieriListState.currentPage > totalPages) {
    abrevieriListState.currentPage = totalPages;
  }
  if (abrevieriListState.currentPage < 1) {
    abrevieriListState.currentPage = 1;
  }
  
  const startIdx = (abrevieriListState.currentPage - 1) * abrevieriListState.itemsPerPage;
  const endIdx = Math.min(startIdx + abrevieriListState.itemsPerPage, totalItems);
  
  pageInfo.textContent = `Pagina ${abrevieriListState.currentPage} din ${totalPages}`;
  prevPageButton.disabled = abrevieriListState.currentPage === 1;
  nextPageButton.disabled = abrevieriListState.currentPage === totalPages;
  
  console.log(`Paginare: ${startIdx}-${endIdx} din ${totalItems} (Pagina ${abrevieriListState.currentPage}/${totalPages})`);
  
  const pageItems = abrevieriListState.filteredAbrevieri.slice(startIdx, endIdx);
  
  const token = localStorage.getItem('jwt');
  const decoded = authUtils.parseJwt(token);
  const isGuest = decoded?.role === 'guest';
  
  pageItems.forEach(entry => {
    const li = document.createElement('li');
    li.dataset.id = entry.id;
    li.className = 'abrev-list-item';
    
    li.innerHTML = `
      <div class="abrev-col">${entry.abreviere}</div>
      <div class="semnif-col">${entry.semnificatie}</div>
      <div class="meta-col">${entry.limba}</div>
      <div class="meta-col">${entry.domeniu}</div>
      <div class="meta-col autor-col">${entry.autor || 'necunoscut'}</div>
      <div class="actions-col abrev-actions"></div>
    `;
    
    li.onclick = (e) => {
  if (!e.target.closest('.abrev-actions')) {
    viewAbreviere(entry);
  }
};

    if (!isGuest && (entry.autor === decoded.username || decoded.role === 'admin')) {
      const actionsCol = li.querySelector('.abrev-actions');
      
      const editBtn = document.createElement('button');
      editBtn.className = 'action-btn edit-btn';
      editBtn.innerHTML = '<span>✎</span>';
      editBtn.title = 'Editează';
      editBtn.addEventListener('click', () => uiHandlers.editAbreviere(entry));
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'action-btn delete-btn';
      deleteBtn.innerHTML = '<span>×</span>';
      deleteBtn.title = 'Șterge';
      deleteBtn.addEventListener('click', () => uiHandlers.deleteAbreviere(entry.id));
      
      actionsCol.appendChild(editBtn);
      actionsCol.appendChild(deleteBtn);
    }
    
    listaElement.appendChild(li);
  });
  
  document.querySelector('.pagination-controls').style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', function() {
  const listSectionLink = document.querySelector('.nav-link[data-section="list"]');
  const listSection = document.getElementById('list-section');
  
  function ensurePaginationWorks() {
    console.log('Verifică funcționarea paginării');
    
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    
    if (prevPageButton && nextPageButton) {

      prevPageButton.removeEventListener('click', prevPageHandler);
      nextPageButton.removeEventListener('click', nextPageHandler);
      
      prevPageButton.addEventListener('click', prevPageHandler);
      nextPageButton.addEventListener('click', nextPageHandler);
      
      console.log('Controale de paginare reinițializate');
    }
  }
  
  function prevPageHandler() {
    if (abrevieriListState.currentPage > 1) {
      abrevieriListState.currentPage--;
      renderAbrevieriList();
    }
  }
  
  function nextPageHandler() {
    const totalPages = Math.ceil(abrevieriListState.filteredAbrevieri.length / abrevieriListState.itemsPerPage);
    if (abrevieriListState.currentPage < totalPages) {
      abrevieriListState.currentPage++;
      renderAbrevieriList();
    }
  }
  
  listSectionLink.addEventListener('click', async function(e) {
    try {
      await loadAllAbrevieri();
      
      const paginationControls = document.querySelector('.pagination-controls');
      if (paginationControls) {
        paginationControls.style.display = 'flex';
      }
      
      setTimeout(ensurePaginationWorks, 500);
    } catch (error) {
      console.error('Eroare la încărcarea abrevierilor:', error);
    }
  });
  
  if (listSection.classList.contains('active')) {
    loadAllAbrevieri().then(() => {
      setTimeout(ensurePaginationWorks, 500);
    });
  }
});
