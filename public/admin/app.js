// --- State ---
let jwtToken = localStorage.getItem('admin_jwt') || ''
let appSecret = localStorage.getItem('admin_secret') || ''

// --- DOM Elements ---
const authScreen = document.getElementById('auth-screen')
const dashboardScreen = document.getElementById('dashboard-screen')

const inputToken = document.getElementById('auth-token')
const inputSecret = document.getElementById('auth-secret')
const btnLogin = document.getElementById('btn-login')
const btnLogout = document.getElementById('btn-logout')

const statUsers = document.getElementById('stat-users')
const statActive = document.getElementById('stat-active')
const statRam = document.getElementById('stat-ram')
const statUptime = document.getElementById('stat-uptime')
const proxyList = document.getElementById('proxy-list')
const proxyHealthBadge = document.getElementById('proxy-health-badge')

// --- Utility: Web Crypto HMAC SHA-256 ---
async function generateHmacSignature(message, secret) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', keyMaterial, enc.encode(message))
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// --- API Client ---
async function apiFetch(endpoint, method = 'GET') {
  const timestamp = Date.now().toString()
  const signature = await generateHmacSignature(endpoint + timestamp, appSecret)

  const response = await fetch(endpoint, {
    method,
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'x-lunex-timestamp': timestamp,
      'x-lunex-signature': signature,
      'Content-Type': 'application/json'
    }
  })

  const data = await response.json()
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'API Request Failed')
  }
  return data.data
}

// --- UI Logic ---
function showToast(msg, type = 'info') {
  const toast = document.createElement('div')
  toast.className = `toast ${type}`
  toast.innerText = msg
  document.getElementById('toast-container').appendChild(toast)
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s forwards'
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

function checkAuth() {
  if (jwtToken && appSecret) {
    authScreen.classList.remove('active')
    dashboardScreen.classList.add('active')
    loadDashboard()
  } else {
    authScreen.classList.add('active')
    dashboardScreen.classList.remove('active')
  }
}

// --- Dashboard ---
function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

async function loadDashboard() {
  try {
    const stats = await apiFetch('/api/admin/stats')
    
    statUsers.innerText = stats.users.windows + stats.users.linux + stats.users.android + stats.users.unknown
    statActive.innerText = stats.activeUsers.windows + stats.activeUsers.linux + stats.activeUsers.android + stats.activeUsers.unknown
    statRam.innerText = stats.server.memory.rss
    statUptime.innerText = formatUptime(stats.server.uptime)

    if (stats.proxies.healthy > 0) {
      proxyHealthBadge.className = 'badge success'
      proxyHealthBadge.innerText = `Healthy (${stats.proxies.healthy}/${stats.proxies.total})`
    } else {
      proxyHealthBadge.className = 'badge danger'
      proxyHealthBadge.innerText = 'All Proxies Down!'
    }

    const proxies = await apiFetch('/api/admin/proxies')
    proxyList.innerHTML = proxies.map((p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td style="font-family: monospace">${p.url}</td>
        <td>${p.country || 'N/A'}</td>
        <td>${p.fails}</td>
        <td class="${p.status === 'active' ? 'status-active' : 'status-cooldown'}">
          ${p.status.toUpperCase()}
        </td>
      </tr>
    `).join('')

  } catch (err) {
    showToast(err.message, 'error')
    if (err.message.includes('Unauthorized') || err.message.includes('Forbidden') || err.message.includes('Access Denied')) {
      logout()
    }
  }
}

// --- Event Listeners ---
btnLogin.addEventListener('click', () => {
  const t = inputToken.value.trim()
  const s = inputSecret.value.trim()
  if (!t || !s) return showToast('Fill all fields', 'error')
  
  jwtToken = t
  appSecret = s
  localStorage.setItem('admin_jwt', t)
  localStorage.setItem('admin_secret', s)
  checkAuth()
})

function logout() {
  jwtToken = ''
  appSecret = ''
  localStorage.removeItem('admin_jwt')
  localStorage.removeItem('admin_secret')
  checkAuth()
}

btnLogout.addEventListener('click', logout)

document.getElementById('btn-refresh-proxies').addEventListener('click', () => {
  loadDashboard()
  showToast('Refreshed', 'success')
})

document.getElementById('btn-reset-proxies').addEventListener('click', async () => {
  try {
    const res = await apiFetch('/api/admin/proxies/reset', 'POST')
    showToast('Cooldowns reset successfully', 'success')
    loadDashboard()
  } catch (err) {
    showToast(err.message, 'error')
  }
})

// --- Init ---
checkAuth()
if (jwtToken) {
  // Auto refresh every 30 seconds
  setInterval(() => {
    if (dashboardScreen.classList.contains('active')) loadDashboard()
  }, 30000)
}
