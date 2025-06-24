async function loadAbrevieri() {
  const token = localStorage.getItem('jwt');
  if (!authUtils.isValidToken(token)) {
    localStorage.removeItem('jwt');
    window.location.href = '../html/login.html';
    return;
  }
  
  const headers = {
    'Authorization': 'Bearer ' + token
  };
  
  try {
    const raspuns = await fetch('/api/abrevieri', {
      method: 'GET',
      headers: headers
    });

    if (!raspuns.ok) {
      throw new Error('Răspuns negativ de la server');
    }

    const abrevieri = await raspuns.json();
    return abrevieri;
  } catch (err) {
    console.error('❌ Eroare la încărcarea abrevierilor:', err);
    localStorage.removeItem('jwt');
    window.location.href = '../html/login.html';
    throw err;
  }
}

async function addAbreviere(abreviereData) {
  const token = localStorage.getItem('jwt');
  if (!authUtils.isValidToken(token)) {
    localStorage.removeItem('jwt');
    window.location.href = '../html/login.html';
    return { succes: false, mesaj: 'Token invalid' };
  }
  
  try {
    const response = await fetch('/api/abrevieri', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(abreviereData)
    });
    
    return await response.json();
  } catch (err) {
    console.error('❌ Eroare la adăugarea abrevierii:', err);
    return { succes: false, mesaj: 'Eroare la comunicarea cu serverul' };
  }
}

async function updateAbreviere(id, abreviereData) {
  const token = localStorage.getItem('jwt');
  if (!authUtils.isValidToken(token)) {
    localStorage.removeItem('jwt');
    window.location.href = '../html/login.html';
    return { succes: false, mesaj: 'Token invalid' };
  }
  
  try {
    const response = await fetch(`/api/abrevieri/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(abreviereData)
    });
    
    return await response.json();
  } catch (err) {
    console.error('❌ Eroare la actualizarea abrevierii:', err);
    return { succes: false, mesaj: 'Eroare la comunicarea cu serverul' };
  }
}

async function deleteAbreviere(id) {
  const token = localStorage.getItem('jwt');
  if (!authUtils.isValidToken(token)) {
    localStorage.removeItem('jwt');
    window.location.href = 'login.html';
    return { succes: false, mesaj: 'Token invalid' };
  }
  
  try {
    const response = await fetch(`/api/abrevieri/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    
    return await response.json();
  } catch (err) {
    console.error('❌ Eroare la ștergerea abrevierii:', err);
    return { succes: false, mesaj: 'Eroare la comunicarea cu serverul' };
  }
}

window.abrevieriService = {
  loadAbrevieri,
  addAbreviere,
  updateAbreviere,
  deleteAbreviere
};
