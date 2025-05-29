document.addEventListener('DOMContentLoaded', () => {

  function parolaValida(parola) {
  const lungimeOK = parola.length >= 6;
  const literaMare = /[A-Z]/.test(parola);
  const cifra = /\d/.test(parola);
  return lungimeOK && literaMare && cifra;
}

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const username = document.getElementById('username').value;
      const parola = document.getElementById('parola').value;

      const raspuns = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, parola })
      });

      const date = await raspuns.json();
      const mesaj = document.getElementById('mesaj');

      console.log(date); 
      if (date.succes && date.token) {
  localStorage.setItem('jwt', date.token);
  window.location.href = '../html/dashboard.html';
}
      
      else {
        mesaj.textContent = 'Date invalide!';
        mesaj.style.color = 'red';document.addEventListener('DOMContentLoaded', () => {

  function parolaValida(parola) {
  const lungimeOK = parola.length >= 6;
  const literaMare = /[A-Z]/.test(parola);
  const cifra = /\d/.test(parola);
  return lungimeOK && literaMare && cifra;
}

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const username = document.getElementById('username').value;
      const parola = document.getElementById('parola').value;

      const raspuns = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, parola })
      });

      const date = await raspuns.json();
      const mesaj = document.getElementById('mesaj');

      console.log(date); 
      if (date.succes && date.token) {
  localStorage.setItem('jwt', date.token);
  window.location.href = '../html/dashboard.html';
}
      
      else {
        mesaj.textContent = 'Date invalide!';
        mesaj.style.color = 'red';
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const username = document.getElementById('regUsername').value;
      const email = document.getElementById('regEmail').value;
      const parola = document.getElementById('regParola').value;

      if (!parolaValida(parola)) {
  const mesaj = document.getElementById('regMesaj');
  mesaj.textContent = 'Parola trebuie să aibă cel puțin 6 caractere, o literă mare și o cifră.';
  mesaj.style.color = 'red';
  return;
}

      const raspuns = await fetch('http://localhost:8080/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username,email, parola })
      });

      const date = await raspuns.json();
      const mesaj = document.getElementById('regMesaj');

      if (date.succes) {
         mesaj.textContent = 'Cont creat cu succes! Redirecționare în 2 secunde...';
  mesaj.style.color = 'green';

  setTimeout(() => {
    window.location.href = '../html/login.html';
  }, 2000);

      } else {
        mesaj.textContent = date.mesaj || 'Eroare la înregistrare.';
        mesaj.style.color = 'red';
      }
    });
  }
  
  const forgotForm = document.getElementById('forgotForm');
if (forgotForm) {
  forgotForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('forgotUsername').value;
    const parolaNoua = document.getElementById('newPassword').value;

    if (!parolaValida(parolaNoua)) {
  const mesaj = document.getElementById('forgotMesaj');
  mesaj.textContent = 'Parola trebuie să aibă cel puțin 6 caractere, o literă mare și o cifră.';
  mesaj.style.color = 'red';
  return;
}

    const raspuns = await fetch('http://localhost:8080/api/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, parolaNoua })
    });

    const date = await raspuns.json();
    const mesaj = document.getElementById('forgotMesaj');

    if (date.succes) {
      mesaj.textContent = 'Parola a fost schimbată!';
      mesaj.style.color = 'green';
    } else {
      mesaj.textContent = date.mesaj || 'Eroare la resetare.';
      mesaj.style.color = 'red';
    }
  });
}

const linkVizitator = document.getElementById('continuaVizitator');
if (linkVizitator) {
  linkVizitator.addEventListener('click', async (e) => {
    e.preventDefault(); 

    const raspuns = await fetch('http://localhost:8080/api/login-guest', {
      method: 'POST'
    });

    const data = await raspuns.json();
    if (data.succes && data.token) {
      localStorage.setItem('jwt', data.token);
      window.location.href = '../html/dashboard.html';
    } else {
      alert('Eroare la autentificare vizitator');
    }
  });
}

});

      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const username = document.getElementById('regUsername').value;
      const email = document.getElementById('regEmail').value;
      const parola = document.getElementById('regParola').value;

      if (!parolaValida(parola)) {
  const mesaj = document.getElementById('regMesaj');
  mesaj.textContent = 'Parola trebuie să aibă cel puțin 6 caractere, o literă mare și o cifră.';
  mesaj.style.color = 'red';
  return;
}

      const raspuns = await fetch('http://localhost:8080/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username,email, parola })
      });

      const date = await raspuns.json();
      const mesaj = document.getElementById('regMesaj');

      if (date.succes) {
         mesaj.textContent = 'Cont creat cu succes! Redirecționare în 2 secunde...';
  mesaj.style.color = 'green';

  setTimeout(() => {
    window.location.href = '../html/login.html';
  }, 2000);

      } else {
        mesaj.textContent = date.mesaj || 'Eroare la înregistrare.';
        mesaj.style.color = 'red';
      }
    });
  }
  
  const forgotForm = document.getElementById('forgotForm');
if (forgotForm) {
  forgotForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('forgotUsername').value;
    const parolaNoua = document.getElementById('newPassword').value;

    if (!parolaValida(parolaNoua)) {
  const mesaj = document.getElementById('forgotMesaj');
  mesaj.textContent = 'Parola trebuie să aibă cel puțin 6 caractere, o literă mare și o cifră.';
  mesaj.style.color = 'red';
  return;
}

    const raspuns = await fetch('http://localhost:8080/api/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, parolaNoua })
    });

    const date = await raspuns.json();
    const mesaj = document.getElementById('forgotMesaj');

    if (date.succes) {
      mesaj.textContent = 'Parola a fost schimbată!';
      mesaj.style.color = 'green';
    } else {
      mesaj.textContent = date.mesaj || 'Eroare la resetare.';
      mesaj.style.color = 'red';
    }
  });
}

const linkVizitator = document.getElementById('continuaVizitator');
if (linkVizitator) {
  linkVizitator.addEventListener('click', async (e) => {
    e.preventDefault(); 

    const raspuns = await fetch('http://localhost:8080/api/login-guest', {
      method: 'POST'
    });

    const data = await raspuns.json();
    if (data.succes && data.token) {
      localStorage.setItem('jwt', data.token);
      window.location.href = '../html/dashboard.html';
    } else {
      alert('Eroare la autentificare vizitator');
    }
  });
}

});
