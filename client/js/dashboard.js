document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('jwt');
  
  if (!authUtils.isValidToken(token)) {
    localStorage.removeItem('jwt');
    window.location.href = '../html/login.html';
    return;
  }
  
  const parsed = authUtils.parseJwt(token);
  const isGuest = parsed?.role === 'guest';

  if (isGuest) {
    const addSection = document.getElementById('add-section');
    if (addSection) {
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
      
      const loginButton = document.getElementById('redirectLogin');
      if (loginButton) {
        loginButton.addEventListener('click', function() {
          localStorage.removeItem('jwt');
          window.location.href = '../html/login.html';
        });
      }
    }
  }

  try {
    const abrevieriTitle = document.querySelector('.abbreviations-section h3');
    if (abrevieriTitle) {
      if (isGuest || parsed?.role === 'admin') {
        abrevieriTitle.textContent = 'Toate Abrevierile';
      } else {
        abrevieriTitle.textContent = 'Abrevierile Tale';
      }
    }

    await uiHandlers.renderAbrevieri();

    const authButtonsContainer = document.getElementById('auth-buttons');
    if (authButtonsContainer) {
      authButtonsContainer.innerHTML = '';
      
      if (isGuest) {
        const btnLogin = document.createElement('button');
        btnLogin.textContent = 'Login to get full access';
        btnLogin.addEventListener('click', () => {
          localStorage.removeItem('jwt');
          window.location.href = '../html/login.html';
        });
        authButtonsContainer.appendChild(btnLogin);
      } else {
        const btnLogout = document.createElement('button');
        btnLogout.textContent = 'Logout';
        btnLogout.addEventListener('click', authUtils.logout);
        authButtonsContainer.appendChild(btnLogout);
      }
    }

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
            const rezultat = await abrevieriService.addAbreviere({
              abreviere,
              semnificatie,
              limba,
              domeniu
            });
            
            if (rezultat.succes) {
              mesajElement.textContent = 'Abreviere adăugată cu succes!';
              mesajElement.style.color = 'green';
              
              formAdd.reset();
              
              setTimeout(() => {
                uiHandlers.renderAbrevieri();
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
    console.error('❌ Eroare la încărcarea paginii:', err);
    localStorage.removeItem('jwt');
    window.location.href = '../html/login.html';
  }
  
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

  authUtils.setupTokenCheck();
});
