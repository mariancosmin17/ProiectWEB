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

    abrevieri.forEach(entry => {
      const li = document.createElement('li');
      li.textContent = `${entry.abreviere} = ${entry.semnificatie} (${entry.limba}, ${entry.domeniu})`;
      lista.appendChild(li);
    });

    const parsed = token ? parseJwt(token) : null;

const container = document.createElement('div');
container.style.marginTop = '20px';

if (parsed?.role === 'guest') {
  const btnLogin = document.createElement('button');
  btnLogin.textContent = 'Login to get full access';
  btnLogin.addEventListener('click', () => {
    localStorage.removeItem('jwt');
    window.location.href = 'login.html';
  });
  container.appendChild(btnLogin);
} else {
  const btnLogout = document.createElement('button');
  btnLogout.textContent = 'Logout';
  btnLogout.addEventListener('click', () => {
    localStorage.removeItem('jwt');
    window.location.href = 'login.html';
  });
  container.appendChild(btnLogout);
}

document.body.appendChild(container);

    if (!token) {
      const privat = document.querySelectorAll('.privat');
      privat.forEach(el => el.style.display = 'none');
    }
  } catch (err) {
    console.error('❌ Eroare la încărcarea abrevierilor:', err);
    
    window.location.href = 'login.html';
  }
});
