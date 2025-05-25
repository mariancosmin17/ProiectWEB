function logout() {
  localStorage.removeItem('jwt');
  window.location.href = 'login.html';
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('jwt');
  const parsed = token ? parseJwt(token) : null;
  const isGuest = parsed?.role === 'guest';

  // Verificăm imediat dacă utilizatorul este vizitator și înlocuim conținutul secțiunii Add
  if (isGuest) {
    const addSection = document.getElementById('add-section');
    if (addSection) {
      // HTML pentru mesajul de vizitator - mai simplu și direct
      addSection.innerHTML = `
        <div class="guest-message">
          <div class="lock-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z" />
            </svg>
          </div>
          <h3>Acces Restricționat</h3>
          <p>Pentru a adăuga abrevieri noi, te rugăm să te autentifici cu un cont de utilizator.</p>
          <button id="redirectLogin" class="login-button">Autentificare</button>
        </div>
      `;
      
      // Adăugăm event listener pentru butonul de autentificare
      const loginButton = document.getElementById('redirectLogin');
      if (loginButton) {
        loginButton.addEventListener('click', function() {
          localStorage.removeItem('jwt'); // Șterge token-ul
          window.location.href = 'login.html'; // Redirecționează
        });
      }
    }
  }

  let headers = {};
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  try {
    const raspuns = await fetch('http://localhost:8080/api/abrevieri', {
      method: 'GET',
      headers: headers
    });

    if (!raspuns.ok) {
      console.warn('⚠️ Token invalid sau lipsă – continuăm ca vizitator');
    }

    const abrevieri = await raspuns.json();
    const lista = document.getElementById('listaAbrevieri');
    
    if (lista) {
      lista.classList.remove('loading'); // Eliminăm clasa loading
      lista.innerHTML = '';
      
      if (abrevieri.length === 0) {
        const liEmpty = document.createElement('li');
        liEmpty.textContent = 'Nu există abrevieri. Adaugă una nouă!';
        lista.appendChild(liEmpty);
      } else {
        abrevieri.forEach(entry => {
          const li = document.createElement('li');
          li.textContent = `${entry.abreviere} = ${entry.semnificatie} (${entry.limba}, ${entry.domeniu})`;
          lista.appendChild(li);
        });
      }
    }
    
    // Actualizează statisticile
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

    // Configurează butonul de autentificare
    const authButtonsContainer = document.getElementById('auth-buttons');
    if (authButtonsContainer) {
      authButtonsContainer.innerHTML = '';
      
      if (isGuest) {
        const btnLogin = document.createElement('button');
        btnLogin.textContent = 'Login to get full access';
        btnLogin.addEventListener('click', () => {
          localStorage.removeItem('jwt');
          window.location.href = 'login.html';
        });
        authButtonsContainer.appendChild(btnLogin);
      } else {
        const btnLogout = document.createElement('button');
        btnLogout.textContent = 'Logout';
        btnLogout.addEventListener('click', logout);
        authButtonsContainer.appendChild(btnLogout);
      }
    }

    // Configurează formularul de adăugare doar pentru utilizatori autentificați
    if (!isGuest) {
      const formAdd = document.getElementById('addForm');
      if (formAdd) {
        formAdd.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const abreviere = document.getElementById('abreviere').value;
          const semnificatie = document.getElementById('semnificatie').value;
          const limba = document.getElementById('limba').value;
          const domeniu = document.getElementById('domeniu').value;
          const mesajElement = document.getElementById('addMesaj');
          
          try {
            const raspunsAdd = await fetch('http://localhost:8080/api/abrevieri', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
              },
              body: JSON.stringify({
                abreviere,
                semnificatie,
                limba,
                domeniu
              })
            });
            
            const rezultat = await raspunsAdd.json();
            
            if (rezultat.succes) {
              mesajElement.textContent = 'Abreviere adăugată cu succes!';
              mesajElement.style.color = 'green';
              
              formAdd.reset();
              
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else {
              mesajElement.textContent = rezultat.mesaj || 'A apărut o eroare!';
              mesajElement.style.color = 'red';
            }
          } catch (err) {
            console.error('❌ Eroare la adăugarea abrevierii:', err);
            mesajElement.textContent = 'Eroare la comunicarea cu serverul!';
            mesajElement.style.color = 'red';
          }
        });
      }
    }
    
  } catch (err) {
    console.error('❌ Eroare la încărcarea abrevierilor:', err);
  }
  
  // Configurează navigația între secțiuni
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const section = this.getAttribute('data-section');
      
      document.querySelectorAll('.content-section').forEach(s => {
        s.classList.remove('active');
      });
      
      document.getElementById(section + '-section').classList.add('active');
      
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });
});
