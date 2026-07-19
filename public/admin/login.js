let jwtToken = localStorage.getItem('lunex_admin_jwt') || ''

document.addEventListener('DOMContentLoaded', () => {
  const jwtInput = document.getElementById('jwtToken')
  if (jwtInput) {
    jwtInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') login()
    })
  }

  document.getElementById('btn-login')?.addEventListener('click', login)

  if (jwtToken) {
    document.getElementById('jwtToken').value = jwtToken
    login()
  }
})

async function login() {
  const tokenInputRaw = document.getElementById('jwtToken').value;
  const tokenMatch = tokenInputRaw.match(/[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/);
  const tokenInput = tokenMatch ? tokenMatch[0] : tokenInputRaw.trim();

  if (!tokenInput) {
    alert('Please enter a valid JWT token')
    return
  }
  
  if (/[^\x20-\x7E]/.test(tokenInput)) {
    alert('Invalid characters in token.')
    return
  }

  jwtToken = tokenInput
  
  try {
    const response = await fetch('/api/status', {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    })
    
    if (!response.ok) throw new Error('Invalid token')

    localStorage.setItem('lunex_admin_jwt', jwtToken)
    
    // Now fetch the secure core JS
    const coreRes = await fetch('/api/admin/core.js', {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    })
    
    if (!coreRes.ok) throw new Error('Failed to load secure dashboard logic')
    const coreJs = await coreRes.text()
    
    // Execute the secure script
    const script = document.createElement('script')
    script.textContent = coreJs
    document.body.appendChild(script)

    document.getElementById('auth-view').classList.remove('active')
    document.getElementById('dashboard-view').classList.add('active')
    
    if (typeof initDashboard === 'function') {
      initDashboard()
    }
  } catch (err) {
    alert('Authentication failed: ' + err.message)
    localStorage.removeItem('lunex_admin_jwt')
    jwtToken = ''
  }
}
