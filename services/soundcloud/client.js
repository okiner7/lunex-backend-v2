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

async function refreshClientId() {
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
          cachedClientId = match[1]
          console.log('[SoundCloud] Client ID refreshed:', cachedClientId)
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
  return cachedClientId
}

async function request(pathOrUrl, params = {}, retries = 4) {
  if (!cachedClientId) await refreshClientId()
  const config = { params: { ...params, client_id: cachedClientId } }

  try {
    const res = await scClient.get(pathOrUrl, config)
    return res.data
  } catch (err) {
    if (err.response?.status === 403 || err.response?.status === 401 || err.message.includes('captcha')) {
      cachedClientId = null
      const newId = await refreshClientId()
      await new Promise(r => setTimeout(r, 1000))
      config.params.client_id = newId || FALLBACK_CLIENT_ID
      const retry = await scClient.get(pathOrUrl, config)
      return retry.data
    }
    if (err.response?.status === 404 && retries > 0) {
      console.warn(`[SoundCloud] 404 on ${pathOrUrl}, firing ${retries} parallel retries...`)
      const parallelRequests = Array.from({ length: retries }).map(async (_, index) => {
        // Slight jitter
        await new Promise(r => setTimeout(r, index * 150))
        const retryConfig = { params: { ...params, client_id: cachedClientId } }
        const retryRes = await scClient.get(pathOrUrl, retryConfig)
        return retryRes.data
      })
      
      try {
        return await Promise.any(parallelRequests)
      } catch (aggregateErr) {
        throw aggregateErr.errors ? aggregateErr.errors[0] : err
      }
    }
    throw err
  }
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
