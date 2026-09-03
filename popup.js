// Popup logic for Finance Tracker & Ticker HUD
document.addEventListener('DOMContentLoaded', async () => {
  const pinnedSymbol = document.getElementById('pinnedSymbol');
  const pinnedPrice = document.getElementById('pinnedPrice');
  const pinnedChange = document.getElementById('pinnedChange');
  const pinnedHigh = document.getElementById('pinnedHigh');
  const pinnedLow = document.getElementById('pinnedLow');
  const ma20El = document.getElementById('ma20');
  const ma50El = document.getElementById('ma50');
  const rsiEl = document.getElementById('rsi');
  const watchlistContainer = document.getElementById('watchlistContainer');
  const refreshBtn = document.getElementById('refreshBtn');
  const badgeModeSelect = document.getElementById('badgeModeSelect');
  const lastUpdated = document.getElementById('lastUpdated');
  const sparkline = document.getElementById('sparkline');
  const rangeButtons = document.querySelectorAll('[data-range]');
  const searchInput = document.getElementById('searchInput');
  const typeFilter = document.getElementById('typeFilter');
  const intervalSelect = document.getElementById('intervalSelect');
  const alertForm = document.getElementById('alertForm');
  const alertAsset = document.getElementById('alertAsset');
  const alertCondition = document.getElementById('alertCondition');
  const alertTarget = document.getElementById('alertTarget');
  const alertList = document.getElementById('alertList');
  const addAssetBtn = document.getElementById('addAssetBtn');
  const addAssetModal = document.getElementById('addAssetModal');
  const customSymbol = document.getElementById('customSymbol');
  const customName = document.getElementById('customName');
  const cancelAddAsset = document.getElementById('cancelAddAsset');
  const confirmAddAsset = document.getElementById('confirmAddAsset');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const themeSelect = document.getElementById('themeSelect');

  let watchlist = CONFIG.DEFAULT_WATCHLIST;
  let pinnedId = CONFIG.DEFAULT_PINNED_ASSET;
  let alerts = [];
  let chartRange = '1d';
  let dragStartIndex = null;

  // Load preferences
  const stored = await chrome.storage.local.get([
    CONFIG.STORAGE_KEYS.watchlist,
    CONFIG.STORAGE_KEYS.pinnedAsset,
    CONFIG.STORAGE_KEYS.badgeMode
    , CONFIG.STORAGE_KEYS.refreshInterval, CONFIG.STORAGE_KEYS.alerts, CONFIG.STORAGE_KEYS.chartRange
  ]);

  watchlist = mergeDefaultWatchlist(stored[CONFIG.STORAGE_KEYS.watchlist]);
  await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.watchlist]: watchlist });
  if (stored[CONFIG.STORAGE_KEYS.pinnedAsset]) pinnedId = stored[CONFIG.STORAGE_KEYS.pinnedAsset];
  if (stored[CONFIG.STORAGE_KEYS.badgeMode]) badgeModeSelect.value = stored[CONFIG.STORAGE_KEYS.badgeMode];
  if (stored[CONFIG.STORAGE_KEYS.refreshInterval]) intervalSelect.value = String(stored[CONFIG.STORAGE_KEYS.refreshInterval]);
  alerts = stored[CONFIG.STORAGE_KEYS.alerts] || [];
  chartRange = stored[CONFIG.STORAGE_KEYS.chartRange] || '1d';
  themeSelect.value = stored[CONFIG.STORAGE_KEYS.theme] || 'dark';
  applyTheme(themeSelect.value);
  rangeButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.range === chartRange);
    button.addEventListener('click', async () => {
      chartRange = button.dataset.range;
      rangeButtons.forEach(item => item.classList.toggle('active', item === button));
      await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.chartRange]: chartRange });
      renderChart(await fetchChartData(pinnedId));
    });
  });

  watchlist.forEach(item => {
    const option = document.createElement('option'); option.value = item.id; option.textContent = item.symbol;
    alertAsset.appendChild(option);
  });
  renderAlerts();

  addAssetBtn.addEventListener('click', () => addAssetModal.classList.add('active'));
  cancelAddAsset.addEventListener('click', () => { addAssetModal.classList.remove('active'); customSymbol.value = ''; customName.value = ''; });
  confirmAddAsset.addEventListener('click', async () => {
    const symbol = customSymbol.value.trim().toUpperCase();
    if (!symbol) return;
    const name = customName.value.trim() || symbol;
    const isCrypto = ['DOGE','ADA','SOL','XRP','DOT','LINK','MATIC','AVAX','UNI','ATOM'].some(s => symbol.includes(s));
    const newAsset = { id: symbol.endsWith('USDT') ? symbol : symbol + 'USDT', symbol, name, type: isCrypto ? 'crypto' : 'commodity', pinned: false };
    watchlist.push(newAsset);
    await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.watchlist]: watchlist });
    addAssetModal.classList.remove('active'); customSymbol.value = ''; customName.value = '';
    refreshPrices();
  });

  exportBtn.addEventListener('click', async () => {
    const data = { watchlist, alerts, pinnedId, badgeMode: badgeModeSelect.value, chartRange, refreshInterval: Number(intervalSelect.value) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `finance-tracker-${new Date().toISOString().split('T')[0]}.json`; a.click();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.watchlist) { watchlist = data.watchlist; await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.watchlist]: watchlist }); }
      if (data.alerts) { alerts = data.alerts; await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.alerts]: alerts }); renderAlerts(); }
      if (data.pinnedId) { pinnedId = data.pinnedId; await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.pinnedAsset]: pinnedId }); }
      if (data.badgeMode) { badgeModeSelect.value = data.badgeMode; await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.badgeMode]: data.badgeMode }); }
      if (data.chartRange) { chartRange = data.chartRange; await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.chartRange]: chartRange }); }
      if (data.refreshInterval) { intervalSelect.value = String(data.refreshInterval); await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.refreshInterval]: data.refreshInterval }); }
      refreshPrices();
    } catch (err) { alert('Invalid import file'); }
    importFile.value = '';
  });

  themeSelect.addEventListener('change', async () => {
    applyTheme(themeSelect.value);
    await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.theme]: themeSelect.value });
  });

  function applyTheme(theme) {
    document.documentElement.style.setProperty('--bg', theme === 'light' ? '#f8fafc' : '#090d16');
    document.documentElement.style.setProperty('--card', theme === 'light' ? '#ffffff' : '#131b2e');
    document.documentElement.style.setProperty('--hover', theme === 'light' ? '#f1f5f9' : '#1e293b');
    document.documentElement.style.setProperty('--text', theme === 'light' ? '#0f172a' : '#f8fafc');
    document.documentElement.style.setProperty('--text-muted', theme === 'light' ? '#64748b' : '#94a3b8');
    document.documentElement.style.setProperty('--border', theme === 'light' ? '#e2e8f0' : '#1e293b');
  }

  watchlistContainer.addEventListener('dragstart', (e) => {
    if (!e.target.classList.contains('watch-row')) return;
    dragStartIndex = Number(e.target.dataset.index);
    e.target.classList.add('drag-over');
  });

  watchlistContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    const row = e.target.closest('.watch-row');
    if (!row) return;
    row.classList.add('drag-over');
  });

  watchlistContainer.addEventListener('dragleave', (e) => {
    const row = e.target.closest('.watch-row');
    if (!row) return;
    row.classList.remove('drag-over');
  });

  watchlistContainer.addEventListener('drop', async (e) => {
    e.preventDefault();
    const row = e.target.closest('.watch-row');
    if (!row || dragStartIndex === null) return;
    const dragEndIndex = Number(row.dataset.index);
    if (dragEndIndex === dragStartIndex) return;
    const [moved] = currentItems.splice(dragStartIndex, 1);
    currentItems.splice(dragEndIndex, 0, moved);
    watchlist = currentItems.map(item => ({ ...item }));
    await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.watchlist]: watchlist });
    renderCurrentItems();
    row.classList.remove('drag-over');
    dragStartIndex = null;
  });

  badgeModeSelect.addEventListener('change', async (e) => {
    await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.badgeMode]: e.target.value });
    chrome.runtime.sendMessage({ action: 'refresh_now' });
  });

  refreshBtn.addEventListener('click', () => {
    refreshPrices();
  });
  searchInput.addEventListener('input', renderCurrentItems);
  typeFilter.addEventListener('change', renderCurrentItems);
  intervalSelect.addEventListener('change', async () => {
    await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.refreshInterval]: Number(intervalSelect.value) });
    chrome.runtime.sendMessage({ action: 'refresh_now' });
  });
  alertForm.addEventListener('submit', async event => {
    event.preventDefault();
    const target = Number(alertTarget.value);
    if (!Number.isFinite(target) || target <= 0) return;
    alerts.push({ symbol: alertAsset.value, condition: alertCondition.value, target, triggered: false });
    await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.alerts]: alerts });
    alertTarget.value = ''; renderAlerts();
  });

  let currentItems = [];
  function renderCurrentItems() {
    const query = searchInput.value.toLowerCase();
    const type = typeFilter.value;
    renderUI(currentItems.filter(item =>
      (!query || `${item.symbol} ${item.name}`.toLowerCase().includes(query)) && (type === 'all' || item.type === type)
    ));
  }

  async function refreshPrices() {
    refreshBtn.textContent = '⏳ Loading...';
    try {
      const pricePromises = watchlist.map(async item => ({ ...item, data: await fetchTicker(item) }));

      const results = await Promise.all(pricePromises);
      currentItems = results;
      renderCurrentItems();
      const klines = await fetchKlines(pinnedId);
      renderChart(klines);
      renderSignals(klines);
      lastUpdated.textContent = `Updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    } catch (err) {
      console.warn('Error fetching prices:', err);
      lastUpdated.textContent = 'Unable to update prices';
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
    } else {
      pinnedSymbol.textContent = 'No price data available';
      pinnedPrice.textContent = '—';
      pinnedChange.textContent = '—';
      pinnedHigh.textContent = '—';
      pinnedLow.textContent = '—';
    }

    // 2. Render Watchlist
    watchlistContainer.innerHTML = '';
    if (!items.length) { watchlistContainer.innerHTML = '<div class="empty">No matching assets.</div>'; return; }
    items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'watch-row';
      row.setAttribute('draggable', 'true');
      row.dataset.index = index;

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
          <span class="badge-pill ${change !== null && change >= 0 ? 'up' : 'down'}">
            ${change !== null ? (change >= 0 ? '+' : '') + change.toFixed(2) + '%' : '—'}
          </span>
          <select class="asset-badge-mode" data-asset="${item.id}" style="background:var(--card);color:var(--text);border:1px solid var(--border);border-radius:3px;padding:2px 4px;font-size:9px;">
            <option value="price" ${item.badgeMode === 'price' ? 'selected' : ''}>$</option>
            <option value="change" ${item.badgeMode === 'change' ? 'selected' : ''}>%</option>
          </select>
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

      // Per-asset badge mode handler
      row.querySelector('.asset-badge-mode').addEventListener('change', async (e) => {
        const asset = watchlist.find(a => a.id === e.target.dataset.asset);
        if (asset) { asset.badgeMode = e.target.value; await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.watchlist]: watchlist }); }
      });

      watchlistContainer.appendChild(row);
    });
  }

  async function fetchChartData(assetId) {
    const item = watchlist.find(entry => entry.id === assetId) || watchlist[0];
    if (!item) return [];
    try {
      if (item.provider === 'yahoo') {
        const interval = chartRange === '1d' ? '1h' : chartRange === '7d' ? '1h' : '1d';
        const response = await fetch(`${CONFIG.APIS.yahooChart}${encodeURIComponent(item.yahooSymbol)}?range=${chartRange}&interval=${interval}`);
        const result = (await response.json()).chart?.result?.[0];
        return result?.indicators?.quote?.[0]?.close?.filter(Number.isFinite).map(close => [0, 0, 0, 0, close]) || [];
      }
      const symbol = item.id === 'XAUUSDT' ? 'PAXGUSDT' : item.id;
      const chartSettings = {
        '1d': { interval: '1h', limit: 24 },
        '7d': { interval: '4h', limit: 42 },
        '1m': { interval: '1d', limit: 31 },
        '3m': { interval: '1d', limit: 93 },
        '1y': { interval: '1d', limit: 365 }
      }[chartRange] || { interval: '1h', limit: 24 };
      const { interval, limit } = chartSettings;
      const response = await fetch(`${CONFIG.APIS.binanceKlines}?symbol=${symbol}&interval=${interval}&limit=${limit}`);
      const rows = response.ok ? await response.json() : [];
      return rows.filter(row => Number.isFinite(Number(row[4])));
    } catch { return []; }
  }

  async function fetchTicker(item) {
    try {
      if (item.provider === 'yahoo') {
        const response = await fetch(`${CONFIG.APIS.yahooChart}${encodeURIComponent(item.yahooSymbol)}?range=1d&interval=1m`);
        const chart = response.ok ? (await response.json()).chart?.result?.[0] : null;
        const meta = chart?.meta;
        const price = meta?.regularMarketPrice;
        const previous = meta?.chartPreviousClose;
        if (!Number.isFinite(price) || !Number.isFinite(previous)) return null;
        const highs = chart.indicators?.quote?.[0]?.high?.filter(Number.isFinite) || [price];
        const lows = chart.indicators?.quote?.[0]?.low?.filter(Number.isFinite) || [price];
        return { lastPrice: String(price), priceChangePercent: String(((price - previous) / previous) * 100), highPrice: String(Math.max(...highs)), lowPrice: String(Math.min(...lows)) };
      }
      const symbol = item.id === 'XAUUSDT' ? 'PAXGUSDT' : item.id;
      const response = await fetch(`${CONFIG.APIS.binanceTicker}${symbol}`);
      return response.ok ? await response.json() : null;
    } catch { return null; }
  }

  function renderChart(klines) {
    if (!klines.length) { sparkline.innerHTML = ''; return; }
    const closes = klines.map(k => Number(k[4]));
    const width = 360, height = 58, pad = 3;
    const min = Math.min(...closes), max = Math.max(...closes), span = max - min || 1;
    const points = closes.map((value, index) => `${pad + index * (width - pad * 2) / Math.max(closes.length - 1, 1)},${height - pad - ((value - min) / span) * (height - pad * 2)}`);
    const line = points.join(' ');
    const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`;
    sparkline.innerHTML = `<polygon class="chart-area" points="${area}"></polygon><polyline class="chart-line" points="${line}"></polyline>`;
  }

  async function fetchKlines(assetId) {
    const item = watchlist.find(entry => entry.id === assetId) || watchlist[0];
    if (!item) return [];
    try {
      if (item.provider === 'yahoo') {
        const response = await fetch(`${CONFIG.APIS.yahooChart}${encodeURIComponent(item.yahooSymbol)}?range=3mo&interval=1d`);
        const result = (await response.json()).chart?.result?.[0];
        const quotes = result?.indicators?.quote?.[0];
        return (quotes?.close || []).map((close, i) => [
          result.timestamp[i] * 1000,
          quotes.open[i],
          quotes.high[i],
          quotes.low[i],
          close,
          quotes.volume[i]
        ]).filter((_, i) => quotes.close[i] && Number.isFinite(quotes.close[i]));
      }
      const symbol = item.id === 'XAUUSDT' ? 'PAXGUSDT' : item.id;
      const interval = '1d';
      const limit = 100;
      const response = await fetch(`${CONFIG.APIS.binanceKlines}?symbol=${symbol}&interval=${interval}&limit=${limit}`);
      return response.ok ? await response.json() : [];
    } catch { return []; }
  }

  function renderSignals(klines) {
    if (klines.length < 50) { ma20El.textContent = ma50El.textContent = rsiEl.textContent = '—'; return; }
    const closes = klines.map(k => Number(k[4])).filter(Number.isFinite);
    const ma20 = calculateMA(closes, 20);
    const ma50 = calculateMA(closes, 50);
    const rsi = calculateRSI(closes, 14);
    const currentPrice = closes[closes.length - 1];
    ma20El.textContent = formatCurrency(ma20);
    ma50El.textContent = formatCurrency(ma50);
    rsiEl.textContent = rsi.toFixed(1);
    rsiEl.style.color = rsi >= 70 ? 'var(--red)' : rsi <= 30 ? 'var(--green)' : 'var(--text)';
    const signal = ma20 > ma50 ? '📈 Bullish' : ma20 < ma50 ? '📉 Bearish' : '➡️ Neutral';
    rsiEl.title = `MA20 vs MA50: ${signal} | RSI ${rsi >= 70 ? 'Overbought' : rsi <= 30 ? 'Oversold' : 'Neutral'}`;
  }

  function calculateMA(closes, period) {
    if (closes.length < period) return null;
    const slice = closes.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  function calculateRSI(closes, period = 14) {
    if (closes.length < period + 1) return null;
    let gains = 0, losses = 0;
    for (let i = closes.length - period; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      if (change >= 0) gains += change; else losses -= change;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  function renderAlerts() {
    alertList.innerHTML = alerts.length ? alerts.map((alert, index) => {
      const item = watchlist.find(entry => entry.id === alert.symbol);
      return `<div class="alert-item"><span>${item?.symbol || alert.symbol} ${alert.condition} ${alert.target}</span><button class="remove-alert" data-index="${index}">Remove</button></div>`;
    }).join('') : 'No active alerts.';
    alertList.querySelectorAll('.remove-alert').forEach(button => button.addEventListener('click', async () => {
      alerts.splice(Number(button.dataset.index), 1);
      await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.alerts]: alerts }); renderAlerts();
    }));
  }

  function mergeDefaultWatchlist(savedWatchlist) {
    if (!Array.isArray(savedWatchlist)) return CONFIG.DEFAULT_WATCHLIST;
    const savedIds = new Set(savedWatchlist.map(item => item.id));
    return [...savedWatchlist, ...CONFIG.DEFAULT_WATCHLIST.filter(item => !savedIds.has(item.id))];
  }

  function formatCurrency(num) {
    if (num >= 1000) {
      return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return '$' + num.toFixed(num < 1 ? 4 : 2);
  }

  // Initial fetch
  refreshPrices();

  function checkStaleData() {
    chrome.storage.local.get('ft_last_updated', (result) => {
      const lastUpdated = result.ft_last_updated;
      if (!lastUpdated) return;
      const age = Date.now() - lastUpdated;
      const interval = Number(intervalSelect.value) * 60 * 1000;
      if (age > interval * 1.5) {
        lastUpdated.textContent = '⚠️ Stale data - click refresh';
        lastUpdated.style.color = 'var(--red)';
      }
    });
  }
});
