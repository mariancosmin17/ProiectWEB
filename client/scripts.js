document.addEventListener('DOMContentLoaded', () => {
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

      if (date.succes) {
        mesaj.textContent = 'Autentificare reușită!';
        mesaj.style.color = 'green';
        
      } else {
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
      const parola = document.getElementById('regParola').value;

      const raspuns = await fetch('http://localhost:8080/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, parola })
      });

      const date = await raspuns.json();
      const mesaj = document.getElementById('regMesaj');

      if (date.succes) {
        mesaj.textContent = 'Cont creat cu succes!';
        mesaj.style.color = 'green';
      } else {
        mesaj.textContent = date.mesaj || 'Eroare la înregistrare.';
        mesaj.style.color = 'red';
      }
    });
  }
});
