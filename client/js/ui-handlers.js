function updateStatistics(abrevieri) {
  const totalElement = document.getElementById('total-abbreviations');
  const categoriesElement = document.getElementById('total-categories');
  const coverageElement = document.getElementById('coverage-percentage');
  
  if (totalElement) totalElement.textContent = abrevieri.length;
  
  if (categoriesElement) {
    const categorii = [...new Set(abrevieri.map(item => item.domeniu).filter(Boolean))];
    categoriesElement.textContent = categorii.length;
  }
  
  if (coverageElement) {
    const acoperire = abrevieri.length > 0 ? '100' : '0';
    coverageElement.textContent = `${acoperire}%`;
  }
}

function editAbreviere(abreviere) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  
  modalContent.innerHTML = `
    <div class="modal-header">
      <h3>Editare Abreviere</h3>
      <span class="close-modal">&times;</span>
    </div>
    <form id="editForm">
    <input type="hidden" id="edit-version" value="${abreviere.version || 1}">
      <div>
        <label for="edit-abreviere">Abreviere:</label>
        <input type="text" id="edit-abreviere" value="${abreviere.abreviere}" required>
      </div>
      <div>
        <label for="edit-semnificatie">Semnificație:</label>
        <input type="text" id="edit-semnificatie" value="${abreviere.semnificatie}" required>
      </div>
      <div>
        <label for="edit-limba">Limbă:</label>
        <input type="text" id="edit-limba" value="${abreviere.limba}" required>
      </div>
      <div>
        <label for="edit-domeniu">Domeniu:</label>
        <input type="text" id="edit-domeniu" value="${abreviere.domeniu}" required>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn-save">Salvează</button>
        <button type="button" class="btn-cancel">Anulează</button>
      </div>
      <p id="editMesaj" class="mesaj"></p>
    </form>
  `;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  setTimeout(() => {
    modal.style.display = 'flex';
    modal.style.opacity = '1';
  }, 10);
  
  const closeBtn = modal.querySelector('.close-modal');
  const cancelBtn = modal.querySelector('.btn-cancel');
  
  function closeModal() {
    modal.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(modal);
    }, 300);
  }
  
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
  });
  
  const editForm = modal.querySelector('#editForm');
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const mesajElement = document.getElementById('editMesaj');
    
    try {
      const updatedData = {
        abreviere: document.getElementById('edit-abreviere').value,
        semnificatie: document.getElementById('edit-semnificatie').value,
        limba: document.getElementById('edit-limba').value,
        domeniu: document.getElementById('edit-domeniu').value,
        version: parseInt(document.getElementById('edit-version').value)
      };
      
      const result = await abrevieriService.updateAbreviere(abreviere.id, updatedData);
      
      if (result.succes) {
        mesajElement.textContent = 'Abreviere actualizată cu succes!';
        mesajElement.style.color = 'green';
        
        setTimeout(() => {
          closeModal();
          renderAbrevieri();
        }, 1500);
      } else {
        mesajElement.textContent = result.mesaj || 'A apărut o eroare!';
        mesajElement.style.color = 'red';
        
        if (result.mesaj && result.mesaj.includes('modificată de altcineva')) {
    mesajElement.innerHTML = result.mesaj + '<br><small>Închide și deschide din nou editarea pentru versiunea actualizată.</small>';
      }
    
    }
    } catch (err) {
      console.error('Eroare la actualizarea abrevierii:', err);
      mesajElement.textContent = 'Eroare la comunicarea cu serverul!';
      mesajElement.style.color = 'red';
    }
  });
}

function deleteAbreviere(id) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content confirm-modal';
  
  modalContent.innerHTML = `
    <div class="modal-header">
      <h3>Confirmare ștergere</h3>
      <span class="close-modal">&times;</span>
    </div>
    <div class="modal-body">
      <p>Ești sigur că dorești să ștergi această abreviere?</p>
      <p>Această acțiune nu poate fi anulată.</p>
    </div>
    <div class="modal-footer">
      <button id="confirmDelete" class="btn-danger">Șterge</button>
      <button id="cancelDelete" class="btn-cancel">Anulează</button>
    </div>
    <p id="deleteMesaj" class="mesaj"></p>
  `;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  setTimeout(() => {
    modal.style.display = 'flex';
    modal.style.opacity = '1';
  }, 10);
  
  const closeBtn = modal.querySelector('.close-modal');
  const cancelBtn = modal.querySelector('#cancelDelete');
  
  function closeModal() {
    modal.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(modal);
    }, 300);
  }
  
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  const confirmBtn = modal.querySelector('#confirmDelete');
  confirmBtn.addEventListener('click', async () => {
    const mesajElement = document.getElementById('deleteMesaj');
    
    try {
      const result = await abrevieriService.deleteAbreviere(id);
      
      if (result.succes) {
        mesajElement.textContent = 'Abreviere ștearsă cu succes!';
        mesajElement.style.color = 'green';
        
        setTimeout(() => {
          closeModal();
          renderAbrevieri();
        }, 1500);
      } else {
        mesajElement.textContent = result.mesaj || 'A apărut o eroare!';
        mesajElement.style.color = 'red';
      }
    } catch (err) {
      console.error('Eroare la ștergerea abrevierii:', err);
      mesajElement.textContent = 'Eroare la comunicarea cu serverul!';
      mesajElement.style.color = 'red';
    }
  });
}

async function renderAbrevieri() {
  try {
    const abrevieri = await abrevieriService.loadAbrevieri();
    const lista = document.getElementById('listaAbrevieri');
    const token = localStorage.getItem('jwt');
    const parsed = authUtils.parseJwt(token);
    const isGuest = parsed?.role === 'guest';
    
    if (lista) {
      lista.classList.remove('loading');
      lista.innerHTML = '';
      
      if (abrevieri.length === 0) {
        const liEmpty = document.createElement('li');
        if (isGuest) {
          liEmpty.textContent = 'Nu există abrevieri disponibile.';
        } else {
          liEmpty.textContent = 'Nu ai adăugat încă nicio abreviere. Adaugă una acum!';
        }
        lista.appendChild(liEmpty);
      } else {
        abrevieri.forEach(entry => {
          const li = document.createElement('li');
          li.dataset.id = entry.id;
          
          const abrevInfo = document.createElement('div');
          abrevInfo.className = 'abrev-info';
          
          if (isGuest || parsed?.role === 'admin') {
            abrevInfo.textContent = `${entry.abreviere} = ${entry.semnificatie} (${entry.limba}, ${entry.domeniu}) - Adăugat de: ${entry.autor || 'necunoscut'}`;
          } else {
            abrevInfo.textContent = `${entry.abreviere} = ${entry.semnificatie} (${entry.limba}, ${entry.domeniu})`;
          }
          
          li.appendChild(abrevInfo);
          
          if (!isGuest && (entry.autor === parsed.username || parsed.role === 'admin')) {
            const actions = document.createElement('div');
            actions.className = 'abrev-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit-btn';
            editBtn.innerHTML = '<span>✎</span>';
            editBtn.title = 'Editează';
            editBtn.addEventListener('click', () => editAbreviere(entry));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.innerHTML = '<span>×</span>';
            deleteBtn.title = 'Șterge';
            deleteBtn.addEventListener('click', () => deleteAbreviere(entry.id));
            
            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            
            li.appendChild(actions);
          }
          
          lista.appendChild(li);
        });
      }
    }
    
    updateStatistics(abrevieri);
  } catch (err) {
    console.error('Eroare la renderizarea abrevierilor:', err);
  }
}

// Export pentru a fi folosit în alte fișiere
window.uiHandlers = {
  updateStatistics,
  editAbreviere,
  deleteAbreviere,
  renderAbrevieri
};
