document.addEventListener('DOMContentLoaded', async () => {
  const profilePicture = document.getElementById('profilePicture');
  const profilePicturePreview = document.getElementById('profilePicturePreview');
  const uploadBtn = document.querySelector('.upload-btn');
  const aboutTextarea = document.getElementById('about');
  const editAboutBtn = document.getElementById('editAboutBtn');
  const saveProfileBtn = document.getElementById('saveProfileBtn');

  const token = localStorage.getItem('jwt');


  const parsed = token ? parseJwt(token) : null;
  console.log('JWT:', token);
console.log('Payload decodat:', parsed);


  if (!parsed?.id) {
    alert('❌ Nu ești autentificat');
    return;
  }

  // Încărcare date profil
  try {
    const res = await fetch(`http://localhost:8080/api/utilizatori/${parsed.id}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('RESPONSE status:', res.status);
const data = await res.json();
console.log('DATE profil primite:', data);


    document.getElementById('firstName').value = data.firstName || '';
    document.getElementById('lastName').value = data.lastName || '';
    document.getElementById('email').value = data.email || '';
    document.getElementById('phone').value = data.telefon || '';
    aboutTextarea.value = data.about || '';
    if (data.pozaProfil) profilePicturePreview.src = data.pozaProfil;
  } catch (err) {
    console.error('❌ Eroare la încărcare profil:', err);
  }

  // Când selectezi o poză, se salvează direct
  profilePicture?.addEventListener('change', () => {
    const file = profilePicture.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        profilePicturePreview.src = base64;

        const userData = { pozaProfil: base64 };
        await updateProfil(parsed.id, userData);
      };
      reader.readAsDataURL(file);
    }
  });

  // Butonul doar deschide selectorul de fișiere
  uploadBtn?.addEventListener('click', () => {
    profilePicture.click();
  });

  // Activează textarea
  editAboutBtn?.addEventListener('click', () => {
    aboutTextarea.removeAttribute('readonly');
    aboutTextarea.focus();
  });

  // Salvează toate datele
  saveProfileBtn?.addEventListener('click', async () => {
    const userData = {
      firstName: document.getElementById('firstName')?.value || '',
      lastName: document.getElementById('lastName')?.value || '',
      email: document.getElementById('email')?.value || '',
      telefon: document.getElementById('phone')?.value || '',
      about: aboutTextarea.value || '',
      pozaProfil: profilePicturePreview?.src || ''
    };

    const success = await updateProfil(parsed.id, userData);
    if (success) {
      alert('✔️ Profil salvat!');
      aboutTextarea.setAttribute('readonly', true);
    }
  });

  async function updateProfil(id, userData) {
    try {
      const raspuns = await fetch(`http://localhost:8080/api/utilizatori/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(userData)
      });

      const rezultat = await raspuns.json();

      if (raspuns.ok && rezultat.succes) {
        return true;
      } else {
        alert('⚠️ ' + (rezultat.mesaj || 'Eroare la actualizare'));
        return false;
      }
    } catch (err) {
      console.error('❌ Eroare la update:', err);
      alert('❌ Eroare la comunicarea cu serverul.');
      return false;
    }
  }

  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }
});
