document.addEventListener('DOMContentLoaded', () => {
  const exportHtmlBtn = document.getElementById('export-html-btn');
  const exportMarkdownBtn = document.getElementById('export-markdown-btn');
  const exportStatus = document.getElementById('export-status');
  const exportMessage = document.getElementById('export-message');
  
  function showExportStatus(message, isSuccess = true) {
    exportMessage.textContent = message;
    exportStatus.className = `export-status ${isSuccess ? 'success' : 'error'}`;
    exportStatus.classList.remove('hidden');
    
    setTimeout(() => {
      exportStatus.classList.add('hidden');
    }, 3000);
  }
  
  async function downloadExport(format) {
    const token = localStorage.getItem('jwt');
    if (!token) {
      showExportStatus('Te rog să te autentifici mai întâi', false);
      return;
    }
    
    try {
      const button = format === 'html' ? exportHtmlBtn : exportMarkdownBtn;
      button.disabled = true;
      button.textContent = 'Se descarcă...';
      
      const response = await fetch(`http://localhost:8080/api/export/${format}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || `abrevieri.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showExportStatus(`Export ${format.toUpperCase()} descărcat cu succes!`, true);
      } else {
        showExportStatus(`Eroare la export ${format.toUpperCase()}`, false);
      }
    } catch (error) {
      showExportStatus(`Eroare la descărcarea ${format.toUpperCase()}`, false);
    } finally {
      const button = format === 'html' ? exportHtmlBtn : exportMarkdownBtn;
      button.disabled = false;
      button.textContent = format === 'html' ? 'Descarcă HTML' : 'Descarcă Markdown';
    }
  }
  
  if (exportHtmlBtn) {
    exportHtmlBtn.addEventListener('click', () => downloadExport('html'));
  }
  
  if (exportMarkdownBtn) {
    exportMarkdownBtn.addEventListener('click', () => downloadExport('markdown'));
  }
});
