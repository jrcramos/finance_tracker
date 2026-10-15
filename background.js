// Background service worker for Finance Tracker & Ticker HUD
importScripts('config.js');

const ALARM_NAME = 'price_poll_alarm';

// Initialize on install or startup
chrome.runtime.onInstalled.addListener(async () => {
  await setupAlarm();
  await updatePricesAndBadge();
});

chrome.runtime.onStartup.addListener(async () => {
  await setupAlarm();
  await updatePricesAndBadge();
});

async function setupAlarm() {
  const result = await chrome.storage.local.get([CONFIG.STORAGE_KEYS.refreshInterval]);
  const interval = result[CONFIG.STORAGE_KEYS.refreshInterval] || CONFIG.DEFAULT_REFRESH_MINUTES;
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: interval });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    updatePricesAndBadge();
  }
});

// Update prices & badge text
async function updatePricesAndBadge() {
  try {
    const result = await chrome.storage.local.get([
      CONFIG.STORAGE_KEYS.watchlist,
      CONFIG.STORAGE_KEYS.pinnedAsset,
      CONFIG.STORAGE_KEYS.badgeMode,
      CONFIG.STORAGE_KEYS.alerts
    ]);

    const watchlist = mergeDefaultWatchlist(result[CONFIG.STORAGE_KEYS.watchlist]);
    const pinnedId = result[CONFIG.STORAGE_KEYS.pinnedAsset] || CONFIG.DEFAULT_PINNED_ASSET;
    const badgeMode = result[CONFIG.STORAGE_KEYS.badgeMode] || CONFIG.DEFAULT_BADGE_MODE;

    const prices = Object.fromEntries(await Promise.all(watchlist.map(async item => [
      item.id,
      await fetchTicker(item)
    ])));

    const data = prices[pinnedId];
    if (data && data.lastPrice) {
      const price = parseFloat(data.lastPrice);
      const change = parseFloat(data.priceChangePercent || 0);

      // Format badge text with precision: e.g. 79.1k, 89.4k, 2.9k, 105k
      let badgeText = '';
      if (badgeMode === 'price') {
        if (price >= 100000) {
          // 100k+
          badgeText = (price / 1000).toFixed(0) + 'k';
        } else if (price >= 1000) {
          // 1,000 - 99,999: show 1 decimal place like 79.1k
          badgeText = (price / 1000).toFixed(1) + 'k';
        } else if (price >= 100) {
          badgeText = price.toFixed(0);
        } else if (price >= 10) {
          badgeText = price.toFixed(1);
        } else {
          badgeText = price.toFixed(2);
        }
      } else {
        const sign = change >= 0 ? '+' : '';
        badgeText = sign + change.toFixed(1) + '%';
      }

      chrome.action.setBadgeText({ text: badgeText });
      chrome.action.setBadgeBackgroundColor({
        color: change >= 0 ? '#10b981' : '#f43f5e'
      });
    }

    // Update sparkline rolling cache
    const sparklinesRes = await chrome.storage.local.get([CONFIG.STORAGE_KEYS.sparklineCache]);
    const sparklines = sparklinesRes[CONFIG.STORAGE_KEYS.sparklineCache] || {};
    for (const [id, tick] of Object.entries(prices)) {
      if (tick && tick.lastPrice) {
        const p = parseFloat(tick.lastPrice);
        if (!sparklines[id]) sparklines[id] = [];
        sparklines[id].push(p);
        if (sparklines[id].length > 20) sparklines[id].shift();
      }
    }

    // Update Fear & Greed index if needed (> 30 mins old)
    const fngRes = await chrome.storage.local.get([CONFIG.STORAGE_KEYS.fearAndGreedCache]);
    let fngData = fngRes[CONFIG.STORAGE_KEYS.fearAndGreedCache];
    if (!fngData || (Date.now() - (fngData.updatedAt || 0) > 30 * 60 * 1000)) {
      const freshFng = await fetchFearAndGreed();
      if (freshFng) fngData = freshFng;
    }

    await chrome.storage.local.set({
      [CONFIG.STORAGE_KEYS.watchlist]: watchlist,
      [CONFIG.STORAGE_KEYS.sparklineCache]: sparklines,
      [CONFIG.STORAGE_KEYS.fearAndGreedCache]: fngData,
      ft_latest_prices: prices,
      ft_last_updated: Date.now()
    });

    // Check alerts
    const alerts = result[CONFIG.STORAGE_KEYS.alerts] || [];
    checkAlerts(alerts, prices);

  } catch (err) {
    console.warn('Price update error:', err);
  }
}

function mergeDefaultWatchlist(savedWatchlist) {
  if (!Array.isArray(savedWatchlist) || savedWatchlist.length === 0) {
    return CONFIG.DEFAULT_WATCHLIST;
  }
  return savedWatchlist;
}

async function fetchFearAndGreed() {
  try {
    const res = await fetch(CONFIG.APIS.fearAndGreed);
    if (!res.ok) return null;
    const json = await res.json();
    const item = json?.data?.[0];
    if (item && item.value) {
      return {
        value: parseInt(item.value, 10),
        classification: item.value_classification || 'Neutral',
        updatedAt: Date.now()
      };
    }
  } catch (err) {
    console.warn('F&G fetch error:', err);
  }
  return null;
}

async function fetchTicker(item) {
  try {
    if (item.provider === 'yahoo') {
      const response = await fetch(`${CONFIG.APIS.yahooChart}${encodeURIComponent(item.yahooSymbol)}?range=1d&interval=1m`);
      if (!response.ok) return null;
      const chart = (await response.json()).chart?.result?.[0];
      const meta = chart?.meta;
      const price = meta?.regularMarketPrice;
      const previous = meta?.chartPreviousClose;
      if (typeof price !== 'number' || typeof previous !== 'number') return null;
      const change = ((price - previous) / previous) * 100;
      const highs = (chart.indicators?.quote?.[0]?.high || [price]).filter(Number.isFinite);
      const lows = (chart.indicators?.quote?.[0]?.low || [price]).filter(Number.isFinite);
      return { 
        lastPrice: String(price), 
        priceChangePercent: String(change), 
        highPrice: String(highs.length ? Math.max(...highs) : price), 
        lowPrice: String(lows.length ? Math.min(...lows) : price) 
      };
    }
    const symbol = item.id === 'XAUUSDT' ? 'PAXGUSDT' : item.id;
    const response = await fetch(`${CONFIG.APIS.binanceTicker}${symbol}`);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

async function checkAlerts(alerts, prices) {
  let changed = false;
  for (const alert of alerts) {
    if (!alert.triggered) {
      const ticker = prices[alert.symbol];
      const currentPrice = ticker ? parseFloat(ticker.lastPrice) : null;
      if (currentPrice === null || Number.isNaN(currentPrice)) continue;
      if ((alert.condition === 'above' && currentPrice >= alert.target) ||
          (alert.condition === 'below' && currentPrice <= alert.target)) {
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/finance-hud.svg',
          title: `🔔 Price Alert: ${alert.symbol}`,
          message: `${alert.symbol} reached ${currentPrice.toLocaleString()} (Target: ${alert.target.toLocaleString()})`,
          priority: 2,
          requireInteraction: true
        });
        alert.triggered = true;
        changed = true;
      }
    }
  }
  if (changed) await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.alerts]: alerts });
}

// Listen for refresh requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'refresh_now') {
    updatePricesAndBadge().then(() => sendResponse({ success: true }));
    return true;
  }
});
