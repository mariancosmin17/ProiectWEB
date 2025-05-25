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
    
    document.getElementById('total-abbreviations').textContent = abrevieri.length;
    
    const categorii = [...new Set(abrevieri.map(item => item.domeniu))];
    document.getElementById('total-categories').textContent = categorii.length;
    
    const acoperire = abrevieri.length > 0 ? '100' : '0';
    document.getElementById('coverage-percentage').textContent = `${acoperire}%`;

    const authButtonsContainer = document.getElementById('auth-buttons');
    authButtonsContainer.innerHTML = '';
    
    const parsed = token ? parseJwt(token) : null;

    if (parsed?.role === 'guest') {
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
      btnLogout.addEventListener('click', () => {
        localStorage.removeItem('jwt');
        window.location.href = 'login.html';
      });
      authButtonsContainer.appendChild(btnLogout);
    }

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
     
          if (!token) {
            mesajElement.textContent = 'Trebuie să fii autentificat pentru a adăuga abrevieri!';
            mesajElement.style.color = 'red';
            return;
          }
          
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

    if (parsed?.role === 'guest') {
      const privat = document.querySelectorAll('.privat');
      privat.forEach(el => el.style.display = 'none');
    }
    
  } catch (err) {
    console.error('❌ Eroare la încărcarea abrevierilor:', err);

    if (err.name === 'AuthError') {
      window.location.href = 'login.html';
    }
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
});
