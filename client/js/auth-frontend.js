function logout() {
  localStorage.removeItem('jwt');
  window.location.href = '../html/login.html';
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

function isValidToken(token) {
  if (!token) return false;
  
  try {
    const decoded = parseJwt(token);
    if (!decoded) return false;
    
    const currentTime = Date.now() / 1000;
    if (decoded.exp && decoded.exp < currentTime) {
      return false;
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

function setupTokenCheck() {
  setInterval(() => {
    const token = localStorage.getItem('jwt');
    if (!isValidToken(token) && window.location.pathname.includes('dashboard.html')) {
      console.log("Token expirat sau invalid, redirecționez către login");
      localStorage.removeItem('jwt');
      window.location.href = 'login.html';
    }
  }, 30000); 
}

window.authUtils = {
  logout,
  parseJwt,
  isValidToken,
  setupTokenCheck
};
