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

    const watchlist = result[CONFIG.STORAGE_KEYS.watchlist] || CONFIG.DEFAULT_WATCHLIST;
    const pinnedId = result[CONFIG.STORAGE_KEYS.pinnedAsset] || 'BTCUSDT';
    const badgeMode = result[CONFIG.STORAGE_KEYS.badgeMode] || 'price';

    // Fetch pinned ticker from public Binance API (free, fast, no API key needed)
    // For gold, PAXGUSDT tracks 1 troy ounce of gold directly 1:1 backed
    const targetSymbol = pinnedId === 'XAUUSDT' ? 'PAXGUSDT' : pinnedId;
    const res = await fetch(`${CONFIG.APIS.binanceTicker}${targetSymbol}`);
    if (!res.ok) return;
    const data = await res.json();

    const price = parseFloat(data.lastPrice);
    const change = parseFloat(data.priceChangePercent);

    // Format badge text
    let badgeText = '';
    if (badgeMode === 'price') {
      if (price >= 1000) {
        badgeText = (price / 1000).toFixed(1) + 'k';
      } else {
        badgeText = price.toFixed(0);
      }
    } else {
      badgeText = (change >= 0 ? '+' : '') + change.toFixed(1) + '%';
    }

    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({
      color: change >= 0 ? '#16a34a' : '#dc2626'
    });

    // Check alerts
    const alerts = result[CONFIG.STORAGE_KEYS.alerts] || [];
    checkAlerts(alerts, pinnedId, price);

  } catch (err) {
    console.warn('Price update error:', err);
  }
}

function checkAlerts(alerts, symbol, currentPrice) {
  alerts.forEach(alert => {
    if (alert.symbol === symbol && !alert.triggered) {
      if ((alert.condition === 'above' && currentPrice >= alert.target) ||
          (alert.condition === 'below' && currentPrice <= alert.target)) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: `🔔 Price Alert: ${symbol}`,
          message: `${symbol} reached ${currentPrice.toLocaleString()} (Target: ${alert.target.toLocaleString()})`
        });
        alert.triggered = true;
      }
    }
  });
}

// Listen for refresh requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'refresh_now') {
    updatePricesAndBadge().then(() => sendResponse({ success: true }));
    return true;
  }
});
