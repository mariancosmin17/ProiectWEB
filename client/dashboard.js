function logout() {
  localStorage.removeItem('jwt');
  window.location.href = 'login.html';
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
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

  const headers = token ? { 'Authorization': 'Bearer ' + token } : {};

  const authButtonsContainer = document.getElementById('auth-buttons');
  authButtonsContainer.innerHTML = '';

  if (parsed?.role === 'guest') {
    const btnLogin = document.createElement('button');
    btnLogin.textContent = 'Login to get full access';
    btnLogin.addEventListener('click', logout);
    authButtonsContainer.appendChild(btnLogin);
    return;
  } else {
    const btnLogout = document.createElement('button');
    btnLogout.textContent = 'Logout';
    btnLogout.addEventListener('click', logout);
    authButtonsContainer.appendChild(btnLogout);
  }

  // === PROFIL ===
  const profilePicture = document.getElementById('profilePicture');
  const profilePicturePreview = document.getElementById('profilePicturePreview');
  const uploadBtn = document.querySelector('.upload-btn');

  uploadBtn?.addEventListener('click', () => {
    profilePicture.click();
  });

  profilePicture?.addEventListener('change', () => {
    const file = profilePicture.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        profilePicturePreview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  if (parsed?.id) {
    try {
      const res = await fetch(`http://localhost:8080/api/utilizatori/${parsed.id}`, {
        method: 'GET',
        headers: headers
      });

      const data = await res.json();

      document.getElementById('firstName').value = data.firstName || '';
document.getElementById('lastName').value = data.lastName || '';
      document.getElementById('email').value = data.email || '';
      document.getElementById('phone').value = data.telefon || '';
      document.getElementById('about').value = data.about || '';
      if (data.pozaProfil) {
        profilePicturePreview.src = data.pozaProfil;
      }
    } catch (err) {
      console.error('❌ Eroare la încărcarea profilului:', err);
    }
  }

 // === Salvare profil: Upload poză + salvare "about" ===
const aboutTextarea = document.getElementById('about');
const editBtn = document.querySelector('.edit-btn');

editBtn?.addEventListener('click', async () => {
  if (!parsed?.id) {
    alert('❌ Nu ești autentificat corespunzător (ID lipsă)');
    return;
  }

  const userData = {
  firstName: document.getElementById('firstName').value,
  lastName: document.getElementById('lastName').value,
  email: document.getElementById('email').value,
  telefon: document.getElementById('phone').value,
  about: aboutTextarea.value
};

  // Dacă s-a selectat o imagine
  if (profilePicture?.files[0]) {
    const reader = new FileReader();
    reader.onloadend = async () => {
      userData.pozaProfil = reader.result;
      await updateProfil(parsed.id, userData);
    };
    reader.readAsDataURL(profilePicture.files[0]);
  } else {
    await updateProfil(parsed.id, userData);
  }
});

// === Funcția de update profil (PUT) ===
async function updateProfil(id, userData) {
  if (!id) {
    alert('❌ Nu ești autentificat corespunzător (ID lipsă)');
    return;
  }

  try {
    const raspuns = await fetch(`http://localhost:8080/api/utilizatori/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('jwt')
      },
      body: JSON.stringify(userData)
    });

    const rezultat = await raspuns.json();

    if (raspuns.ok) {
      if (rezultat.succes) {
        alert('✔️ Profil salvat cu succes!');
      } else {
        alert('⚠️ Nicio modificare detectată. Profilul este deja actualizat.');
      }
    } else {
      console.error('❌ Eroare server:', rezultat);
      alert('❌ ' + (rezultat.mesaj || 'Eroare la actualizare.'));
    }

  } catch (err) {
    console.error('❌ Eroare la update:', err);
    alert('❌ Eroare la comunicarea cu serverul.');
  }
}



  // Navigare între secțiuni
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const section = this.getAttribute('data-section');
      document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
      document.getElementById(section + '-section').classList.add('active');
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });
});
