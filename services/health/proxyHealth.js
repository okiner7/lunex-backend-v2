const axios = require('axios');
const { getRandomProxyAgent } = require('../../src/middleware/proxyManager');
const telegramBot = require('../bot/telegramBot');

let isHealthy = true;
let consecutiveFailures = 0;
let healthCheckInterval = null;
const MAX_FAILURES = 3;

async function checkProxy() {
  const agent = getRandomProxyAgent();
  if (!agent) {
    return;
  }

  try {
    const res = await axios.get('https://api-v2.soundcloud.com/resolve?url=https://soundcloud.com/skrillex', {
      httpsAgent: agent,
      timeout: 10000,
      proxy: false,
      validateStatus: () => true
    });

    if (res.status >= 500) {
      throw new Error(`Bad proxy status: ${res.status}`);
    }

    if (!isHealthy) {
      console.log('[Health] Proxy recovered!');
      telegramBot.sendAdminAlert('✅ *Прокси восстановлен*\nСоединение с прокси-сервером успешно установлено.');
    }
    isHealthy = true;
    consecutiveFailures = 0;
  } catch (err) {
    consecutiveFailures++;
    console.warn(`[Health] Proxy check failed (${consecutiveFailures}/${MAX_FAILURES}):`, err.message);

    if (consecutiveFailures >= MAX_FAILURES && isHealthy) {
      isHealthy = false;
      console.error('[Health] Proxy is marked as UNHEALTHY!');
      telegramBot.sendAdminAlert(`🛑 *Проблема с прокси*\nПрокси-сервер недоступен 3 раза подряд. Пользователи могут испытывать проблемы с музыкой.\n\nОшибка: ${err.message}`);
    }
  }
}

function start(intervalMs = 10 * 60 * 1000) {
  if (healthCheckInterval) clearInterval(healthCheckInterval);
  checkProxy();
  healthCheckInterval = setInterval(checkProxy, intervalMs);
  console.log(`[Health] Proxy checker started (every ${intervalMs / 60000} min)`);
}

function stop() {
  if (healthCheckInterval) clearInterval(healthCheckInterval);
  healthCheckInterval = null;
}

function getStatus() {
  return isHealthy;
}

module.exports = { start, stop, getStatus, isHealthy: getStatus };
