// Popup logic for Finance Tracker & Ticker HUD
document.addEventListener('DOMContentLoaded', async () => {
  const pinnedSymbol = document.getElementById('pinnedSymbol');
  const pinnedPrice = document.getElementById('pinnedPrice');
  const pinnedChange = document.getElementById('pinnedChange');
  const pinnedHigh = document.getElementById('pinnedHigh');
  const pinnedLow = document.getElementById('pinnedLow');
  const watchlistContainer = document.getElementById('watchlistContainer');
  const refreshBtn = document.getElementById('refreshBtn');
  const badgeModeSelect = document.getElementById('badgeModeSelect');
  const lastUpdated = document.getElementById('lastUpdated');

  let watchlist = CONFIG.DEFAULT_WATCHLIST;
  let pinnedId = 'XAUUSDT';

  // Load preferences
  const stored = await chrome.storage.local.get([
    CONFIG.STORAGE_KEYS.watchlist,
    CONFIG.STORAGE_KEYS.pinnedAsset,
    CONFIG.STORAGE_KEYS.badgeMode
  ]);

  if (stored[CONFIG.STORAGE_KEYS.watchlist]) watchlist = stored[CONFIG.STORAGE_KEYS.watchlist];
  if (stored[CONFIG.STORAGE_KEYS.pinnedAsset]) pinnedId = stored[CONFIG.STORAGE_KEYS.pinnedAsset];
  if (stored[CONFIG.STORAGE_KEYS.badgeMode]) badgeModeSelect.value = stored[CONFIG.STORAGE_KEYS.badgeMode];

  badgeModeSelect.addEventListener('change', async (e) => {
    await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.badgeMode]: e.target.value });
    chrome.runtime.sendMessage({ action: 'refresh_now' });
  });

  refreshBtn.addEventListener('click', () => {
    refreshPrices();
  });

  async function refreshPrices() {
    refreshBtn.textContent = '⏳ Loading...';
    try {
      const pricePromises = watchlist.map(item => {
        const symbol = item.id === 'XAUUSDT' ? 'PAXGUSDT' : item.id;
        return fetch(`${CONFIG.APIS.binanceTicker}${symbol}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => ({ ...item, data }))
          .catch(() => ({ ...item, data: null }));
      });

      const results = await Promise.all(pricePromises);
      renderUI(results);
      lastUpdated.textContent = `Updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    } catch (err) {
      console.warn('Error fetching prices:', err);
    } finally {
      refreshBtn.textContent = '🔄 Refresh';
    }
  }

  function renderUI(items) {
    // 1. Render Pinned Item Card
    const pinnedItem = items.find(i => i.id === pinnedId) || items[0];
    if (pinnedItem && pinnedItem.data) {
      const price = parseFloat(pinnedItem.data.lastPrice);
      const change = parseFloat(pinnedItem.data.priceChangePercent);
      const high = parseFloat(pinnedItem.data.highPrice);
      const low = parseFloat(pinnedItem.data.lowPrice);

      pinnedSymbol.textContent = `${pinnedItem.symbol} (${pinnedItem.name})`;
      pinnedPrice.textContent = formatCurrency(price);
      
      pinnedChange.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
      pinnedChange.className = `badge-pill ${change >= 0 ? 'up' : 'down'}`;

      pinnedHigh.textContent = formatCurrency(high);
      pinnedLow.textContent = formatCurrency(low);
    }

    // 2. Render Watchlist
    watchlistContainer.innerHTML = '';
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'watch-row';

      const isPinned = item.id === pinnedId;
      const data = item.data;
      const price = data ? parseFloat(data.lastPrice) : null;
      const change = data ? parseFloat(data.priceChangePercent) : null;

      row.innerHTML = `
        <div class="watch-left">
          <button class="pin-btn ${isPinned ? 'active' : ''}" title="Pin to browser badge">⭐</button>
          <div>
            <div class="watch-name">${item.symbol}</div>
            <div class="watch-sub">${item.name}</div>
          </div>
        </div>
        <div class="watch-right">
          <div class="watch-price">${price !== null ? formatCurrency(price) : '—'}</div>
          <span class="badge-pill ${change >= 0 ? 'up' : 'down'}">
            ${change !== null ? (change >= 0 ? '+' : '') + change.toFixed(2) + '%' : '—'}
          </span>
        </div>
      `;

      // Pin button handler
      row.querySelector('.pin-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        pinnedId = item.id;
        await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.pinnedAsset]: pinnedId });
        chrome.runtime.sendMessage({ action: 'refresh_now' });
        refreshPrices();
      });

      watchlistContainer.appendChild(row);
    });
  }

  function formatCurrency(num) {
    if (num >= 1000) {
      return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return '$' + num.toFixed(num < 1 ? 4 : 2);
  }

  // Initial fetch
  refreshPrices();
});
