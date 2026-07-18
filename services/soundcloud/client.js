const axios = require('axios')
const { getRandomProxyAgent, markProxyFailed, markProxySuccess } = require('../../src/middleware/proxyManager')

const scClient = axios.create({
  baseURL: 'https://api-v2.soundcloud.com',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://soundcloud.com/',
    'Origin': 'https://soundcloud.com'
  }
})

scClient.interceptors.request.use(config => {
  const agent = getRandomProxyAgent()
  if (agent) {
    config.httpsAgent = agent
    config._proxyAgent = agent // сохраняем для markFailed
    config.proxy = false
  }
  return config
})

// Авто-пометка успешных запросов
scClient.interceptors.response.use(
  res => {
    if (res.config._proxyAgent) markProxySuccess(res.config._proxyAgent)
    return res
  },
  err => {
    const status = err.response?.status
    const agent = err.config?._proxyAgent
    // 403, 429, 0 (timeout/network) — признак проблемного прокси
    if (agent && (status === 403 || status === 429 || !status)) {
      markProxyFailed(agent)
    }
    return Promise.reject(err)
  }
)

let cachedClientId = null
const FALLBACK_CLIENT_ID = 'iErh0hlIS7lC1NEeRzcimBG8NFFF045C'
let refreshPromise = null

async function refreshClientId() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const { data: html } = await axios.get('https://soundcloud.com', {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html',
          'Accept-Language': 'ru-RU,ru;q=0.9'
        }
      })

      const scriptUrls = html.match(/https:\/\/a-v2\.sndcdn\.com\/assets\/[a-zA-Z0-9-]+\.js/g)
      if (!scriptUrls) return null

      for (const url of scriptUrls.slice(-15).reverse()) {
        try {
          const { data: js } = await axios.get(url, { timeout: 5000 })
          const match = js.match(/client_id\s*:\s*["']([a-zA-Z0-9]{32})["']/)
          if (match) {
            if (cachedClientId !== match[1]) {
              cachedClientId = match[1]
              console.log('[SoundCloud] Client ID refreshed:', cachedClientId)
            }
            refreshPromise = null
            return cachedClientId
          }
        } catch { continue }
      }
    } catch (e) {
      console.error('[SoundCloud] Scrape Error:', e.message)
    }

    if (!cachedClientId) {
      cachedClientId = FALLBACK_CLIENT_ID
      console.warn('[SoundCloud] Using fallback client_id')
    }
    refreshPromise = null
    return cachedClientId
  })()

  return refreshPromise
}

async function request(pathOrUrl, params = {}, retries = 4) {
  if (!cachedClientId) await refreshClientId()

  let lastErr = null
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    const config = { params: { ...params, client_id: cachedClientId } }
    try {
      const res = await scClient.get(pathOrUrl, config)
      return res.data
    } catch (err) {
      lastErr = err
      const status = err.response?.status
      
      // 401 Unauthorized — скорее всего протух client_id
      if (status === 401 && attempt < retries) {
        cachedClientId = null
        await refreshClientId()
        continue
      }
      
      // 403, 429 или 0 (timeout) — бан прокси. 
      // interceptor уже пометил прокси как failed, мы просто пробуем еще раз (до 4 раз).
      // На следующем круге interceptor подставит НОВЫЙ прокси из пула.
      if ((status === 403 || status === 429 || !status || err.message.includes('captcha')) && attempt < retries) {
        // небольшая задержка перед следующим прокси
        await new Promise(r => setTimeout(r, 500))
        continue
      }

      // 404 — обычно означает что трек удален или эксклюзив Go+. 
      // Нет смысла долбить другие прокси, прерываем сразу, чтобы плеер быстрее скипнул трек.
      if (status === 404) {
        console.warn(`[SoundCloud] 404 on ${pathOrUrl}, skipping retries.`)
        break
      }

      // Если ни одно условие не подошло, или кончились попытки — кидаем ошибку
      break
    }
  }
  
  throw lastErr
}

async function fetchAll(initialPath, maxItems = 1000) {
  let results = []
  let nextHref = initialPath
  while (nextHref) {
    const data = await request(nextHref)
    const collection = data.collection || (Array.isArray(data) ? data : (data.tracks ? data.tracks : []))
    results = results.concat(collection)
    nextHref = data.next_href || null
    if (results.length >= maxItems || !collection.length) break
  }
  return results
}

async function getUserId(profileUrl) {
  const user = await request('/resolve', { url: profileUrl })
  if (!user || !user.id) throw new Error('User not found')
  return user.id
}

module.exports = { scClient, request, fetchAll, refreshClientId, getUserId }
