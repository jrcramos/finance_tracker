/**
 * Finance Terminal & Ticker HUD — Core Application Engine
 * Supports both compact popup HUD and full-screen workstation dashboard.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const appRoot = document.getElementById('appRoot') || document.getElementById('dashboardRoot');
  const refreshBtn = document.getElementById('refreshBtn');
  const refreshIcon = document.getElementById('refreshIcon');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundOnIcon = document.getElementById('soundOnIcon');
  const soundOffIcon = document.getElementById('soundOffIcon');
  const popoutTerminalBtn = document.getElementById('popoutTerminalBtn');
  const marqueeTrack = document.getElementById('marqueeTrack');

  // Hero Card Elements
  const heroSymbol = document.getElementById('heroSymbol');
  const heroName = document.getElementById('heroName');
  const heroPrice = document.getElementById('heroPrice');
  const heroDelta = document.getElementById('heroDelta');
  const heroDeltaVal = document.getElementById('heroDeltaVal');
  const heroLowPrice = document.getElementById('heroLowPrice');
  const heroHighPrice = document.getElementById('heroHighPrice');
  const rangeFill = document.getElementById('rangeFill');
  const rangePin = document.getElementById('rangePin');

  // Chart Elements
  const chartCanvas = document.getElementById('mainChartCanvas');
  const chartStage = document.getElementById('chartStage');
  const chartTooltip = document.getElementById('chartTooltip');
  const tooltipTime = document.getElementById('tooltipTime');
  const tooltipPrice = document.getElementById('tooltipPrice');
  const btnChartArea = document.getElementById('btnChartArea');
  const btnChartCandle = document.getElementById('btnChartCandle');
  const timeframeButtons = document.querySelectorAll('.timeframe-btn');

  // Technical Indicator Elements
  const maValuesEl = document.getElementById('maValues');
  const maSignalEl = document.getElementById('maSignal');
  const rsiValueEl = document.getElementById('rsiValue');
  const rsiSignalEl = document.getElementById('rsiSignal');
  const fngValueEl = document.getElementById('fngValue');
  const fngSignalEl = document.getElementById('fngSignal');
  const technicalMeterText = document.getElementById('technicalMeterText');
  const segStrongSell = document.getElementById('segStrongSell');
  const segSell = document.getElementById('segSell');
  const segNeutral = document.getElementById('segNeutral');
  const segBuy = document.getElementById('segBuy');
  const segStrongBuy = document.getElementById('segStrongBuy');

  // Screener / Watchlist Elements
  const watchlistContainer = document.getElementById('watchlistContainer');
  const screenerSearch = document.getElementById('screenerSearch');
  const screenerTypeFilter = document.getElementById('screenerTypeFilter');
  const openAddAssetModalBtn = document.getElementById('openAddAssetModalBtn');

  // Portfolio Elements
  const portfolioTotalVal = document.getElementById('portfolioTotalVal');
  const portfolio24hPnl = document.getElementById('portfolio24hPnl');
  const portfolioAllTimePnl = document.getElementById('portfolioAllTimePnl');
  const portfolioDonutSvg = document.getElementById('portfolioDonutSvg');
  const donutLegend = document.getElementById('donutLegend');
  const holdingsListContainer = document.getElementById('holdingsListContainer');
  const openAddHoldingBtn = document.getElementById('openAddHoldingBtn');

  // Alerts Elements
  const alertBuilderForm = document.getElementById('alertBuilderForm');
  const alertAssetSelect = document.getElementById('alertAssetSelect');
  const alertConditionSelect = document.getElementById('alertConditionSelect');
  const alertTargetInput = document.getElementById('alertTargetInput');
  const activeAlertsList = document.getElementById('activeAlertsList');

  // Settings Elements
  const settingBadgeMode = document.getElementById('settingBadgeMode');
  const settingCurrency = document.getElementById('settingCurrency');
  const settingTheme = document.getElementById('settingTheme');
  const settingInterval = document.getElementById('settingInterval');
  const exportDataBtn = document.getElementById('exportDataBtn');
  const importDataBtn = document.getElementById('importDataBtn');
  const importFileInput = document.getElementById('importFileInput');
  const lastUpdatedText = document.getElementById('lastUpdatedText');
  const themeIndicator = document.getElementById('themeIndicator');

  // Modals
  const addAssetModal = document.getElementById('addAssetModal');
  const customSymbolInput = document.getElementById('customSymbolInput');
  const customNameInput = document.getElementById('customNameInput');
  const customTypeInput = document.getElementById('customTypeInput');
  const cancelAddAssetBtn = document.getElementById('cancelAddAssetBtn');
  const confirmAddAssetBtn = document.getElementById('confirmAddAssetBtn');

  // Holding Modal Elements (USD-first & intuitive)
  const addHoldingModal = document.getElementById('addHoldingModal');
  const holdingModalTitleText = document.getElementById('holdingModalTitleText');
  const editingHoldingId = document.getElementById('editingHoldingId');
  const holdingAssetSelect = document.getElementById('holdingAssetSelect');
  const holdingCurrentPriceInfo = document.getElementById('holdingCurrentPriceInfo');
  const modeUsdBtn = document.getElementById('modeUsdBtn');
  const modeUnitsBtn = document.getElementById('modeUnitsBtn');
  const holdingUsdContainer = document.getElementById('holdingUsdContainer');
  const holdingUnitsContainer = document.getElementById('holdingUnitsContainer');
  const holdingUsdAmountInput = document.getElementById('holdingUsdAmountInput');
  const holdingUsdCalcPreview = document.getElementById('holdingUsdCalcPreview');
  const holdingAmountInput = document.getElementById('holdingAmountInput');
  const holdingBuyPriceInput = document.getElementById('holdingBuyPriceInput');
  const cancelAddHoldingBtn = document.getElementById('cancelAddHoldingBtn');
  const confirmAddHoldingBtn = document.getElementById('confirmAddHoldingBtn');

  // Navigation Tabs
  const navTabButtons = document.querySelectorAll('.nav-tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Application State
  let watchlist = CONFIG.DEFAULT_WATCHLIST;
  let pinnedId = CONFIG.DEFAULT_PINNED_ASSET;
  let activeHeroId = CONFIG.DEFAULT_PINNED_ASSET;
  let holdings = CONFIG.DEFAULT_HOLDINGS;
  let alerts = [];
  let chartRange = '24h';
  let chartType = 'area';
  let currentCurrency = 'USD';
  let currentTheme = 'obsidian';
  let soundEnabled = true;
  let badgeMode = 'price';
  let currentPrices = {};
  let historicalKlines = [];
  let dragStartIndex = null;
  let holdingEntryMode = 'usd'; // 'usd' or 'units'

  // Initialize Storage & State
  const stored = await UniversalStorage.get([
    CONFIG.STORAGE_KEYS.watchlist,
    CONFIG.STORAGE_KEYS.pinnedAsset,
    CONFIG.STORAGE_KEYS.badgeMode,
    CONFIG.STORAGE_KEYS.chartRange,
    CONFIG.STORAGE_KEYS.chartType,
    CONFIG.STORAGE_KEYS.currency,
    CONFIG.STORAGE_KEYS.theme,
    CONFIG.STORAGE_KEYS.soundEnabled,
    CONFIG.STORAGE_KEYS.portfolio,
    CONFIG.STORAGE_KEYS.alerts,
    CONFIG.STORAGE_KEYS.refreshInterval
  ]);

  if (stored[CONFIG.STORAGE_KEYS.watchlist]) {
    watchlist = mergeDefaultWatchlist(stored[CONFIG.STORAGE_KEYS.watchlist]);
  }
  if (stored[CONFIG.STORAGE_KEYS.pinnedAsset]) {
    pinnedId = stored[CONFIG.STORAGE_KEYS.pinnedAsset];
    activeHeroId = pinnedId;
  }
  if (stored[CONFIG.STORAGE_KEYS.badgeMode]) badgeMode = stored[CONFIG.STORAGE_KEYS.badgeMode];
  if (stored[CONFIG.STORAGE_KEYS.chartRange]) chartRange = stored[CONFIG.STORAGE_KEYS.chartRange];
  if (stored[CONFIG.STORAGE_KEYS.chartType]) chartType = stored[CONFIG.STORAGE_KEYS.chartType];
  if (stored[CONFIG.STORAGE_KEYS.currency]) currentCurrency = stored[CONFIG.STORAGE_KEYS.currency];
  if (stored[CONFIG.STORAGE_KEYS.theme]) currentTheme = stored[CONFIG.STORAGE_KEYS.theme];
  if (typeof stored[CONFIG.STORAGE_KEYS.soundEnabled] === 'boolean') soundEnabled = stored[CONFIG.STORAGE_KEYS.soundEnabled];
  if (stored[CONFIG.STORAGE_KEYS.portfolio]) holdings = stored[CONFIG.STORAGE_KEYS.portfolio];
  if (stored[CONFIG.STORAGE_KEYS.alerts]) alerts = stored[CONFIG.STORAGE_KEYS.alerts];

  // Apply Theme & Audio Settings
  applyTheme(currentTheme);
  updateSoundUI();
  updateTimeframeUI();
  updateChartTypeUI();
  populateDropdowns();

  if (settingBadgeMode) settingBadgeMode.value = badgeMode;
  if (settingCurrency) settingCurrency.value = currentCurrency;
  if (settingTheme) settingTheme.value = currentTheme;
  if (settingInterval && stored[CONFIG.STORAGE_KEYS.refreshInterval]) {
    settingInterval.value = String(stored[CONFIG.STORAGE_KEYS.refreshInterval]);
  }

  // Set up Web Audio Synthesizer
  const audioCtx = (typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined')
    ? new (window.AudioContext || window.webkitAudioContext)()
    : null;

  function playChime(type = 'success') {
    if (!soundEnabled || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      if (type === 'alert') {
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // ignore audio errors
    }
  }

  function updateSoundUI() {
    if (!soundOnIcon || !soundOffIcon) return;
    if (soundEnabled) {
      soundOnIcon.style.display = 'block';
      soundOffIcon.style.display = 'none';
      soundToggleBtn?.classList.remove('active');
    } else {
      soundOnIcon.style.display = 'none';
      soundOffIcon.style.display = 'block';
      soundToggleBtn?.classList.add('active');
    }
  }

  soundToggleBtn?.addEventListener('click', async () => {
    soundEnabled = !soundEnabled;
    updateSoundUI();
    await UniversalStorage.set({ [CONFIG.STORAGE_KEYS.soundEnabled]: soundEnabled });
    if (soundEnabled) playChime('success');
  });

  // Popout Terminal Button
  popoutTerminalBtn?.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    } else {
      window.open('dashboard.html', '_blank');
    }
  });

  // Navigation Tab Switching
  navTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      navTabButtons.forEach(b => b.classList.toggle('active', b === btn));
      tabContents.forEach(tc => tc.classList.toggle('active', tc.id === `tab-${tabName}`));
      if (tabName === 'terminal') {
        setTimeout(renderChart, 50);
      }
    });
  });

  // Chart Type Toggle
  btnChartArea?.addEventListener('click', async () => {
    chartType = 'area';
    updateChartTypeUI();
    await UniversalStorage.set({ [CONFIG.STORAGE_KEYS.chartType]: chartType });
    renderChart();
  });

  btnChartCandle?.addEventListener('click', async () => {
    chartType = 'candle';
    updateChartTypeUI();
    await UniversalStorage.set({ [CONFIG.STORAGE_KEYS.chartType]: chartType });
    renderChart();
  });

  function updateChartTypeUI() {
    btnChartArea?.classList.toggle('active', chartType === 'area');
    btnChartCandle?.classList.toggle('active', chartType === 'candle');
  }

  // Timeframe Buttons
  timeframeButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      chartRange = btn.dataset.range;
      updateTimeframeUI();
      await UniversalStorage.set({ [CONFIG.STORAGE_KEYS.chartRange]: chartRange });
      await loadChartData();
    });
  });

  function updateTimeframeUI() {
    timeframeButtons.forEach(b => b.classList.toggle('active', b.dataset.range === chartRange));
  }

  // Search & Type Filter for Screener
  screenerSearch?.addEventListener('input', renderWatchlist);
  screenerTypeFilter?.addEventListener('change', renderWatchlist);

  // Settings Event Handlers
  settingBadgeMode?.addEventListener('change', async (e) => {
    badgeMode = e.target.value;
    await UniversalStorage.set({ [CONFIG.STORAGE_KEYS.badgeMode]: badgeMode });
    updateLiveBadge();
  });

  settingCurrency?.addEventListener('change', async (e) => {
    currentCurrency = e.target.value;
    await UniversalStorage.set({ [CONFIG.STORAGE_KEYS.currency]: currentCurrency });
    renderAllViews();
  });

  settingTheme?.addEventListener('change', async (e) => {
    currentTheme = e.target.value;
    applyTheme(currentTheme);
    await UniversalStorage.set({ [CONFIG.STORAGE_KEYS.theme]: currentTheme });
  });

  settingInterval?.addEventListener('change', async (e) => {
    const val = Number(e.target.value);
    await UniversalStorage.set({ [CONFIG.STORAGE_KEYS.refreshInterval]: val });
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'refresh_now' });
    }
  });

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeIndicator) {
      const names = { obsidian: 'Obsidian Pro', cyber: 'Cyberpunk', midnight: 'Midnight Navy', light: 'Crisp Light' };
      themeIndicator.textContent = names[theme] || 'Obsidian Pro';
    }
  }

  // Data Export / Import
  exportDataBtn?.addEventListener('click', () => {
    const data = {
      watchlist,
      holdings,
      alerts,
      pinnedId,
      badgeMode,
      currentCurrency,
      currentTheme,
      chartRange,
      chartType,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-terminal-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  importDataBtn?.addEventListener('click', () => importFileInput?.click());
  importFileInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.watchlist)) watchlist = parsed.watchlist;
      if (Array.isArray(parsed.holdings)) holdings = parsed.holdings;
      if (Array.isArray(parsed.alerts)) alerts = parsed.alerts;
      if (parsed.pinnedId) pinnedId = parsed.pinnedId;
      if (parsed.currentCurrency) currentCurrency = parsed.currentCurrency;
      if (parsed.currentTheme) {
        currentTheme = parsed.currentTheme;
        applyTheme(currentTheme);
      }

      await UniversalStorage.set({
        [CONFIG.STORAGE_KEYS.watchlist]: watchlist,
        [CONFIG.STORAGE_KEYS.portfolio]: holdings,
        [CONFIG.STORAGE_KEYS.alerts]: alerts,
        [CONFIG.STORAGE_KEYS.pinnedAsset]: pinnedId,
        [CONFIG.STORAGE_KEYS.currency]: currentCurrency,
        [CONFIG.STORAGE_KEYS.theme]: currentTheme
      });

      playChime('success');
      refreshAll();
    } catch {
      alert('Invalid backup file format');
    }
    importFileInput.value = '';
  });

  // Modal: Add Custom Asset
  openAddAssetModalBtn?.addEventListener('click', () => addAssetModal?.classList.add('active'));
  cancelAddAssetBtn?.addEventListener('click', () => addAssetModal?.classList.remove('active'));
  confirmAddAssetBtn?.addEventListener('click', async () => {
    const sym = (customSymbolInput?.value || '').trim().toUpperCase();
    if (!sym) return;
    const name = (customNameInput?.value || '').trim() || sym;
    const type = customTypeInput?.value || 'crypto';
    const id = sym.includes('USDT') ? sym : `${sym}USDT`;

    const existingIndex = watchlist.findIndex(w => w.id === id || w.symbol === sym);
    if (existingIndex >= 0) {
      watchlist[existingIndex].name = name;
      watchlist[existingIndex].type = type;
    } else {
      const newAsset = {
        id,
        symbol: sym,
        name,
        type,
        pinned: false,
        badgeMode: 'price',
        precision: 2
      };
      watchlist.push(newAsset);
    }

    await UniversalStorage.set({ [CONFIG.STORAGE_KEYS.watchlist]: watchlist });
    addAssetModal?.classList.remove('active');
    customSymbolInput.value = '';
    customNameInput.value = '';
    populateDropdowns();
    refreshAll();
  });

  // -------------------------------------------------------------
  // Intuitive USD-First Asset Holding Management
  // -------------------------------------------------------------
  function getAssetPrice(assetId) {
    const quote = currentPrices[assetId];
    if (quote && quote.lastPrice) return parseFloat(quote.lastPrice);
    const fallback = getFallbackQuote({ id: assetId });
    return parseFloat(fallback.lastPrice);
  }

  function updateHoldingPreview() {
    const assetId = holdingAssetSelect?.value || watchlist[0]?.id;
    const curPrice = getAssetPrice(assetId);
    const asset = watchlist.find(w => w.id === assetId);

    if (holdingCurrentPriceInfo) {
      holdingCurrentPriceInfo.textContent = `Current Market Price: ${formatMoney(curPrice)}`;
    }

    if (holdingUsdCalcPreview) {
      const usdVal = parseFloat(holdingUsdAmountInput?.value);
      if (!isNaN(usdVal) && usdVal > 0 && curPrice > 0) {
        const units = usdVal / curPrice;
        const decimals = units < 0.01 ? 6 : (units < 1 ? 4 : 2);
        holdingUsdCalcPreview.textContent = `≈ ${units.toFixed(decimals)} ${asset?.symbol || ''} locked at current market price`;
        holdingUsdCalcPreview.style.color = 'var(--bull)';
      } else {
        holdingUsdCalcPreview.textContent = `≈ 0.00 units locked at current price`;
        holdingUsdCalcPreview.style.color = 'var(--text-secondary)';
      }
    }
  }

  // Toggle Mode: USD Value vs Units
  modeUsdBtn?.addEventListener('click', () => {
    holdingEntryMode = 'usd';
    modeUsdBtn.classList.add('active');
    modeUnitsBtn.classList.remove('active');
    if (holdingUsdContainer) holdingUsdContainer.style.display = 'block';
    if (holdingUnitsContainer) holdingUnitsContainer.style.display = 'none';
    updateHoldingPreview();
  });

  modeUnitsBtn?.addEventListener('click', () => {
    holdingEntryMode = 'units';
    modeUnitsBtn.classList.add('active');
    modeUsdBtn.classList.remove('active');
    if (holdingUsdContainer) holdingUsdContainer.style.display = 'none';
    if (holdingUnitsContainer) holdingUnitsContainer.style.display = 'block';

    // Pre-populate units and buy price if USD is filled
    const assetId = holdingAssetSelect?.value;
    const curPrice = getAssetPrice(assetId);
    const usdVal = parseFloat(holdingUsdAmountInput?.value);
    if (!isNaN(usdVal) && usdVal > 0 && curPrice > 0) {
      holdingAmountInput.value = (usdVal / curPrice).toFixed(4);
      holdingBuyPriceInput.value = curPrice.toFixed(2);
    }
  });

  holdingUsdAmountInput?.addEventListener('input', updateHoldingPreview);
  holdingAssetSelect?.addEventListener('change', updateHoldingPreview);

  // Open "Add Asset / Track Asset" Modal
  openAddHoldingBtn?.addEventListener('click', () => {
    if (holdingModalTitleText) holdingModalTitleText.textContent = 'Track Asset Value';
    if (confirmAddHoldingBtn) confirmAddHoldingBtn.textContent = 'Start Tracking';
    if (editingHoldingId) editingHoldingId.value = '';
    if (holdingAssetSelect) holdingAssetSelect.disabled = false;
    if (holdingUsdAmountInput) holdingUsdAmountInput.value = '';
    if (holdingAmountInput) holdingAmountInput.value = '';
    if (holdingBuyPriceInput) holdingBuyPriceInput.value = '';
    modeUsdBtn?.click();
    updateHoldingPreview();
    addHoldingModal?.classList.add('active');
    setTimeout(() => holdingUsdAmountInput?.focus(), 100);
  });

  cancelAddHoldingBtn?.addEventListener('click', () => {
    addHoldingModal?.classList.remove('active');
  });

  // Confirm Add / Update Holding
  confirmAddHoldingBtn?.addEventListener('click', async () => {
    const editId = editingHoldingId?.value;
    const assetId = editId || holdingAssetSelect?.value;
    if (!assetId) return;

    const curPrice = getAssetPrice(assetId);
    let amount = 0;
    let buyPrice = curPrice;

    if (holdingEntryMode === 'usd') {
      const usdVal = parseFloat(holdingUsdAmountInput?.value);
      if (isNaN(usdVal) || usdVal <= 0) {
        alert('Please enter how much you have in USD right now.');
        holdingUsdAmountInput?.focus();
        return;
      }
      amount = usdVal / curPrice;
      buyPrice = curPrice; // Locked in at current market price!
    } else {
      amount = parseFloat(holdingAmountInput?.value);
      const customBuy = parseFloat(holdingBuyPriceInput?.value);
      buyPrice = (!isNaN(customBuy) && customBuy > 0) ? customBuy : curPrice;
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter quantity owned.');
        holdingAmountInput?.focus();
        return;
      }
    }

    const existingIndex = holdings.findIndex(h => h.id === assetId);
    const now = Date.now();

    if (editId && existingIndex >= 0) {
      // Direct update of the holding
      holdings[existingIndex].amount = amount;
      holdings[existingIndex].buyPrice = buyPrice;
      holdings[existingIndex].updatedAt = now;
    } else if (existingIndex >= 0) {
      // Combine / replace
      const prev = holdings[existingIndex];
      const newAmount = prev.amount + amount;
      const newAvgBuy = ((prev.amount * prev.buyPrice) + (amount * buyPrice)) / newAmount;
      holdings[existingIndex] = { ...prev, amount: newAmount, buyPrice: newAvgBuy, updatedAt: now };
    } else {
      holdings.push({
        id: assetId,
        amount,
        buyPrice,
        addedAt: now
      });
    }

    await UniversalStorage.set({ [CONFIG.STORAGE_KEYS.portfolio]: holdings });
    addHoldingModal?.classList.remove('active');
    if (holdingUsdAmountInput) holdingUsdAmountInput.value = '';
    if (holdingAmountInput) holdingAmountInput.value = '';
    if (holdingBuyPriceInput) holdingBuyPriceInput.value = '';
    if (editingHoldingId) editingHoldingId.value = '';
    if (holdingAssetSelect) holdingAssetSelect.disabled = false;

    renderPortfolio();
    playChime('success');
  });

  // Alert Builder Form
  alertBuilderForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const assetId = alertAssetSelect?.value;
    const condition = alertConditionSelect?.value;
    const target = parseFloat(alertTargetInput?.value);
    if (!assetId || isNaN(target) || target <= 0) return;

    alerts.push({
      id: Date.now(),
      symbol: assetId,
      condition,
      target,
      triggered: false,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    await UniversalStorage.set({ [CONFIG.STORAGE_KEYS.alerts]: alerts });
    alertTargetInput.value = '';
    renderAlerts();
    playChime('success');
  });

  // Drag & Drop Watchlist Reordering
  watchlistContainer?.addEventListener('dragstart', (e) => {
    const row = e.target.closest('.asset-row');
    if (!row) return;
    dragStartIndex = Number(row.dataset.index);
    row.classList.add('drag-over');
  });

  watchlistContainer?.addEventListener('dragover', (e) => {
    e.preventDefault();
    const row = e.target.closest('.asset-row');
    if (!row) return;
    row.classList.add('drag-over');
  });

  watchlistContainer?.addEventListener('dragleave', (e) => {
    const row = e.target.closest('.asset-row');
    if (!row) return;
    row.classList.remove('drag-over');
  });

  watchlistContainer?.addEventListener('drop', async (e) => {
    e.preventDefault();
    const row = e.target.closest('.asset-row');
    if (!row || dragStartIndex === null) return;
    const dragEndIndex = Number(row.dataset.index);
    if (dragEndIndex === dragStartIndex) return;

    const [moved] = watchlist.splice(dragStartIndex, 1);
    watchlist.splice(dragEndIndex, 0, moved);
    await UniversalStorage.set({ [CONFIG.STORAGE_KEYS.watchlist]: watchlist });
    renderWatchlist();
    row.classList.remove('drag-over');
    dragStartIndex = null;
  });

  // Refresh Button Click
  refreshBtn?.addEventListener('click', () => {
    refreshAll();
  });

  // Populate Dropdowns
  function populateDropdowns() {
    if (alertAssetSelect) {
      alertAssetSelect.innerHTML = '';
      watchlist.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = `${item.symbol} (${item.name})`;
        alertAssetSelect.appendChild(opt);
      });
    }

    if (holdingAssetSelect) {
      holdingAssetSelect.innerHTML = '';
      watchlist.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = `${item.symbol} (${item.name})`;
        holdingAssetSelect.appendChild(opt);
      });
    }
  }

  // Currency Converter Utility
  function formatMoney(usdAmount, decimals = 2) {
    if (usdAmount === null || usdAmount === undefined || isNaN(usdAmount)) return '—';
    const curr = CONFIG.CURRENCIES[currentCurrency] || CONFIG.CURRENCIES.USD;
    const converted = usdAmount * curr.rate;
    const sym = curr.symbol;

    if (converted >= 1000) {
      return `${sym}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    }
    return `${sym}${converted.toFixed(converted < 1 ? 4 : decimals)}`;
  }

  // Badge Text Formatter: Ensures 79.1k, 89.4k, 2.9k rather than rounded integers
  function formatBadgeText(price, change, mode = 'price') {
    if (price === null || price === undefined || isNaN(price)) return '';
    if (mode === 'price') {
      if (price >= 100000) {
        return (price / 1000).toFixed(0) + 'k';
      } else if (price >= 1000) {
        return (price / 1000).toFixed(1) + 'k'; // e.g. 79.1k
      } else if (price >= 100) {
        return Math.round(price).toString();
      } else if (price >= 10) {
        return price.toFixed(1);
      } else {
        return price.toFixed(2);
      }
    } else {
      const sign = change >= 0 ? '+' : '';
      return sign + change.toFixed(1) + '%';
    }
  }

  function updateLiveBadge() {
    const data = currentPrices[pinnedId];
    if (data && typeof chrome !== 'undefined' && chrome.action && chrome.action.setBadgeText) {
      const price = parseFloat(data.lastPrice);
      const change = parseFloat(data.priceChangePercent || 0);
      const text = formatBadgeText(price, change, badgeMode);
      chrome.action.setBadgeText({ text });
      chrome.action.setBadgeBackgroundColor({
        color: change >= 0 ? '#10b981' : '#f43f5e'
      });
    }
  }

  // Safe Default Data Seed Generator
  function getFallbackQuote(item) {
    const baselines = {
      'XAUUSDT': 2914.80,
      'BTCUSDT': 79140.00,
      'ETHUSDT': 3295.40,
      'SOLUSDT': 198.20,
      'SP500': 5985.60,
      'QQQ': 512.40,
      'EURUSDT': 1.0540,
      'JPYUSD': 152.60,
      'DXY': 104.35,
      'WTI_OIL': 71.40
    };
    const base = baselines[item.id] || 100.00;
    const jitter = (Math.random() - 0.49) * (base * 0.003);
    const price = base + jitter;
    const change = 0.45 + (Math.random() - 0.45) * 1.5;
    return {
      lastPrice: String(price),
      priceChangePercent: String(change),
      highPrice: String(price * 1.012),
      lowPrice: String(price * 0.988)
    };
  }

  // Ticker Fetcher
  async function fetchTicker(item) {
    try {
      if (item.provider === 'yahoo') {
        const res = await fetch(`${CONFIG.APIS.yahooChart}${encodeURIComponent(item.yahooSymbol)}?range=1d&interval=1m`);
        if (!res.ok) throw new Error('Yahoo error');
        const data = await res.json();
        const chart = data.chart?.result?.[0];
        const meta = chart?.meta;
        const price = meta?.regularMarketPrice;
        const prev = meta?.chartPreviousClose;
        if (typeof price !== 'number' || typeof prev !== 'number') throw new Error('Invalid quote');
        const change = ((price - prev) / prev) * 100;
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
      const res = await fetch(`${CONFIG.APIS.binanceTicker}${symbol}`);
      if (!res.ok) throw new Error('Binance error');
      return await res.json();
    } catch {
      return getFallbackQuote(item);
    }
  }

  // Historical Klines Fetcher
  async function fetchKlines(assetId, range) {
    const item = watchlist.find(w => w.id === assetId) || watchlist[0];
    const settings = {
      '1h': { interval: '1m', limit: 60, spanHours: 1 },
      '24h': { interval: '15m', limit: 96, spanHours: 24 },
      '7d': { interval: '1h', limit: 168, spanHours: 168 },
      '1m': { interval: '4h', limit: 180, spanHours: 720 },
      '1y': { interval: '1d', limit: 365, spanHours: 8760 }
    }[range] || { interval: '15m', limit: 96, spanHours: 24 };

    try {
      if (item.provider === 'yahoo') {
        const yahooRange = range === '1h' ? '1d' : (range === '24h' ? '1d' : (range === '7d' ? '5d' : (range === '1m' ? '1mo' : '1y')));
        const yahooInterval = range === '1h' ? '2m' : (range === '24h' ? '15m' : (range === '7d' ? '1h' : '1d'));
        const res = await fetch(`${CONFIG.APIS.yahooChart}${encodeURIComponent(item.yahooSymbol)}?range=${yahooRange}&interval=${yahooInterval}`);
        if (!res.ok) throw new Error('Yahoo chart error');
        const data = await res.json();
        const result = data.chart?.result?.[0];
        const timestamps = result?.timestamp || [];
        const quote = result?.indicators?.quote?.[0] || {};
        const closes = quote.close || [];
        const opens = quote.open || [];
        const highs = quote.high || [];
        const lows = quote.low || [];
        const volumes = quote.volume || [];

        const rows = [];
        for (let i = 0; i < timestamps.length; i++) {
          if (closes[i] !== null && Number.isFinite(closes[i])) {
            rows.push([
              timestamps[i] * 1000,
              opens[i] || closes[i],
              highs[i] || closes[i],
              lows[i] || closes[i],
              closes[i],
              volumes[i] || 100
            ]);
          }
        }
        if (rows.length > 5) return rows;
      }

      const symbol = item.id === 'XAUUSDT' ? 'PAXGUSDT' : item.id;
      const res = await fetch(`${CONFIG.APIS.binanceKlines}?symbol=${symbol}&interval=${settings.interval}&limit=${settings.limit}`);
      if (!res.ok) throw new Error('Binance klines error');
      const rows = await res.json();
      return rows.map(r => [
        Number(r[0]),
        parseFloat(r[1]),
        parseFloat(r[2]),
        parseFloat(r[3]),
        parseFloat(r[4]),
        parseFloat(r[5])
      ]);
    } catch {
      const current = currentPrices[assetId] ? parseFloat(currentPrices[assetId].lastPrice) : 2900;
      const points = settings.limit;
      const now = Date.now();
      const step = (settings.spanHours * 3600 * 1000) / points;
      let walk = current * (1 - (Math.random() - 0.45) * 0.04);
      const rows = [];
      for (let i = 0; i < points; i++) {
        const time = now - (points - i) * step;
        const drift = (Math.random() - 0.495) * (current * 0.004);
        const open = walk;
        walk += drift;
        const close = walk;
        const high = Math.max(open, close) + Math.random() * (current * 0.002);
        const low = Math.min(open, close) - Math.random() * (current * 0.002);
        const vol = Math.round(50 + Math.random() * 200);
        rows.push([time, open, high, low, close, vol]);
      }
      return rows;
    }
  }

  // Load Main Chart Data
  async function loadChartData() {
    historicalKlines = await fetchKlines(activeHeroId, chartRange);
    renderChart();
    renderTechnicalSignals();
  }

  // Render Interactive Canvas Chart
  function renderChart() {
    if (!chartCanvas || !historicalKlines.length) return;
    const ctx = chartCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = chartCanvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    chartCanvas.width = width * dpr;
    chartCanvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const padLeft = 10;
    const padRight = 54;
    const padTop = 15;
    const padBottom = 25;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const times = historicalKlines.map(k => k[0]);
    const opens = historicalKlines.map(k => k[1]);
    const highs = historicalKlines.map(k => k[2]);
    const lows = historicalKlines.map(k => k[3]);
    const closes = historicalKlines.map(k => k[4]);
    const volumes = historicalKlines.map(k => k[5]);

    const minPrice = Math.min(...lows);
    const maxPrice = Math.max(...highs);
    const priceSpan = (maxPrice - minPrice) || 1;
    const maxVol = Math.max(...volumes) || 1;

    const isBull = closes[closes.length - 1] >= opens[0];
    const strokeColor = isBull ? '#10b981' : '#f43f5e';
    const glowColor = isBull ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)';

    function getX(index) {
      return padLeft + (index / (historicalKlines.length - 1)) * plotW;
    }

    function getY(price) {
      return padTop + plotH - ((price - minPrice) / priceSpan) * plotH;
    }

    // 1. Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    for (let i = 0; i <= 3; i++) {
      const yVal = padTop + (i / 3) * plotH;
      ctx.beginPath();
      ctx.moveTo(padLeft, yVal);
      ctx.lineTo(width - padRight, yVal);
      ctx.stroke();

      const priceVal = maxPrice - (i / 3) * priceSpan;
      ctx.fillStyle = '#64748b';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(formatMoney(priceVal), width - padRight + 6, yVal + 3);
    }
    ctx.setLineDash([]);

    // 2. Volume Bars at Bottom
    const volMaxH = plotH * 0.25;
    historicalKlines.forEach((k, i) => {
      const x = getX(i);
      const barW = Math.max(1.5, (plotW / historicalKlines.length) * 0.7);
      const h = (k[5] / maxVol) * volMaxH;
      const y = padTop + plotH - h;
      ctx.fillStyle = k[4] >= k[1] ? 'rgba(16, 185, 129, 0.18)' : 'rgba(244, 63, 94, 0.18)';
      ctx.fillRect(x - barW / 2, y, barW, h);
    });

    // 3. Area or Candlestick
    if (chartType === 'area') {
      const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
      grad.addColorStop(0, glowColor);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.moveTo(getX(0), getY(closes[0]));
      for (let i = 1; i < closes.length; i++) {
        const xc = (getX(i) + getX(i - 1)) / 2;
        const yc = (getY(closes[i]) + getY(closes[i - 1])) / 2;
        ctx.quadraticCurveTo(getX(i - 1), getY(closes[i - 1]), xc, yc);
      }
      ctx.lineTo(getX(closes.length - 1), getY(closes[closes.length - 1]));
      ctx.lineTo(getX(closes.length - 1), padTop + plotH);
      ctx.lineTo(getX(0), padTop + plotH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(getX(0), getY(closes[0]));
      for (let i = 1; i < closes.length; i++) {
        const xc = (getX(i) + getX(i - 1)) / 2;
        const yc = (getY(closes[i]) + getY(closes[i - 1])) / 2;
        ctx.quadraticCurveTo(getX(i - 1), getY(closes[i - 1]), xc, yc);
      }
      ctx.lineTo(getX(closes.length - 1), getY(closes[closes.length - 1]));
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

    } else {
      const candleW = Math.max(2.5, (plotW / historicalKlines.length) * 0.7);
      historicalKlines.forEach((k, i) => {
        const x = getX(i);
        const openY = getY(k[1]);
        const highY = getY(k[2]);
        const lowY = getY(k[3]);
        const closeY = getY(k[4]);
        const isUp = k[4] >= k[1];
        const color = isUp ? '#10b981' : '#f43f5e';

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        ctx.fillStyle = color;
        const top = Math.min(openY, closeY);
        const bodyH = Math.max(1.5, Math.abs(closeY - openY));
        ctx.fillRect(x - candleW / 2, top, candleW, bodyH);
      });
    }

    // 4. Time Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const timeStep = Math.floor(historicalKlines.length / 4);
    for (let i = 0; i < historicalKlines.length; i += timeStep) {
      const date = new Date(times[i]);
      const label = chartRange === '1h' || chartRange === '24h'
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : `${date.getMonth() + 1}/${date.getDate()}`;
      ctx.fillText(label, getX(i), height - 8);
    }
  }

  // Crosshair & Tooltip Interactive Hover
  chartStage?.addEventListener('mousemove', (e) => {
    if (!historicalKlines.length || !chartCanvas) return;
    const rect = chartCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padLeft = 10;
    const padRight = 54;
    const plotW = rect.width - padLeft - padRight;

    if (x < padLeft || x > rect.width - padRight) {
      chartTooltip.style.display = 'none';
      return;
    }

    const index = Math.min(
      historicalKlines.length - 1,
      Math.max(0, Math.round(((x - padLeft) / plotW) * (historicalKlines.length - 1)))
    );

    const candle = historicalKlines[index];
    const time = new Date(candle[0]);
    const price = candle[4];
    const firstPrice = historicalKlines[0][4];
    const delta = ((price - firstPrice) / firstPrice) * 100;

    tooltipTime.textContent = time.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    tooltipPrice.innerHTML = `${formatMoney(price)} <span class="tooltip-delta" style="color:${delta >= 0 ? 'var(--bull)' : 'var(--bear)'}">${delta >= 0 ? '+' : ''}${delta.toFixed(2)}%</span>`;

    chartTooltip.style.display = 'block';
    chartTooltip.style.left = `${e.clientX - rect.left}px`;
    chartTooltip.style.top = `${e.clientY - rect.top}px`;
  });

  chartStage?.addEventListener('mouseleave', () => {
    if (chartTooltip) chartTooltip.style.display = 'none';
  });

  // Technical Analysis Calculations
  function renderTechnicalSignals() {
    if (historicalKlines.length < 15) return;
    const closes = historicalKlines.map(k => k[4]);
    const ma20 = calcMA(closes, 20);
    const ma50 = calcMA(closes, 50);
    const rsi = calcRSI(closes, 14);

    if (maValuesEl) {
      maValuesEl.textContent = `${formatMoney(ma20 || closes[closes.length - 1])} / ${formatMoney(ma50 || closes[0])}`;
    }

    if (maSignalEl) {
      if (ma20 && ma50) {
        maSignalEl.textContent = ma20 > ma50 ? 'Bullish Cross (MA20 > MA50)' : 'Bearish Cross (MA20 < MA50)';
        maSignalEl.style.color = ma20 > ma50 ? 'var(--bull)' : 'var(--bear)';
      }
    }

    if (rsiValueEl) {
      rsiValueEl.textContent = rsi.toFixed(1);
    }

    if (rsiSignalEl) {
      if (rsi >= 70) {
        rsiSignalEl.textContent = 'Overbought (>70)';
        rsiSignalEl.style.color = 'var(--bear)';
      } else if (rsi <= 30) {
        rsiSignalEl.textContent = 'Oversold (<30)';
        rsiSignalEl.style.color = 'var(--bull)';
      } else {
        rsiSignalEl.textContent = 'Neutral Zone (30-70)';
        rsiSignalEl.style.color = 'var(--text-secondary)';
      }
    }

    if (fngValueEl && fngSignalEl) {
      const fng = Math.round(58 + (rsi - 50) * 0.4);
      fngValueEl.textContent = `${fng} / 100`;
      if (fng >= 75) {
        fngSignalEl.textContent = 'Extreme Greed';
        fngSignalEl.style.color = 'var(--bull)';
      } else if (fng >= 55) {
        fngSignalEl.textContent = 'Greed';
        fngSignalEl.style.color = '#34d399';
      } else if (fng <= 25) {
        fngSignalEl.textContent = 'Extreme Fear';
        fngSignalEl.style.color = 'var(--bear)';
      } else if (fng <= 45) {
        fngSignalEl.textContent = 'Fear';
        fngSignalEl.style.color = '#fb7185';
      } else {
        fngSignalEl.textContent = 'Neutral';
        fngSignalEl.style.color = 'var(--accent-gold)';
      }
    }

    let score = 0;
    if (ma20 && ma50 && ma20 > ma50) score += 2;
    if (rsi > 50 && rsi < 70) score += 1;
    if (rsi >= 70) score -= 1;
    if (rsi <= 30) score += 1;

    const segments = [segStrongSell, segSell, segNeutral, segBuy, segStrongBuy];
    segments.forEach(s => {
      if (s) s.className = 'meter-segment';
    });

    if (technicalMeterText) {
      if (score >= 2) {
        technicalMeterText.textContent = 'STRONG BUY';
        technicalMeterText.className = 'meter-status bull';
        segStrongBuy?.classList.add('active-strong-buy');
      } else if (score === 1) {
        technicalMeterText.textContent = 'BUY';
        technicalMeterText.className = 'meter-status bull';
        segBuy?.classList.add('active-buy');
      } else if (score === 0) {
        technicalMeterText.textContent = 'NEUTRAL';
        technicalMeterText.className = 'meter-status neutral';
        segNeutral?.classList.add('active-neutral');
      } else if (score === -1) {
        technicalMeterText.textContent = 'SELL';
        technicalMeterText.className = 'meter-status bear';
        segSell?.classList.add('active-sell');
      } else {
        technicalMeterText.textContent = 'STRONG SELL';
        technicalMeterText.className = 'meter-status bear';
        segStrongSell?.classList.add('active-strong-sell');
      }
    }
  }

  function calcMA(arr, period) {
    if (arr.length < period) return null;
    const slice = arr.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  function calcRSI(arr, period = 14) {
    if (arr.length < period + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = arr.length - period; i < arr.length; i++) {
      const diff = arr[i] - arr[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // Render Hero Card
  function renderHeroCard() {
    const asset = watchlist.find(w => w.id === activeHeroId) || watchlist[0];
    if (!asset) return;

    const data = currentPrices[asset.id];
    const price = data ? parseFloat(data.lastPrice) : null;
    const change = data ? parseFloat(data.priceChangePercent) : 0;
    const high = data ? parseFloat(data.highPrice) : price;
    const low = data ? parseFloat(data.lowPrice) : price;

    if (heroSymbol) heroSymbol.textContent = asset.symbol;
    if (heroName) heroName.textContent = asset.name;
    if (heroPrice) {
      heroPrice.textContent = formatMoney(price);
      heroPrice.className = `hero-price ${change >= 0 ? 'flash-up' : 'flash-down'}`;
    }

    if (heroDelta) {
      heroDelta.className = `delta-badge ${change >= 0 ? 'up' : 'down'}`;
    }
    if (heroDeltaVal) {
      heroDeltaVal.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    }

    if (heroLowPrice) heroLowPrice.textContent = formatMoney(low);
    if (heroHighPrice) heroHighPrice.textContent = formatMoney(high);

    if (rangeFill && rangePin && high && low && high > low && price) {
      const pct = Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100));
      rangeFill.style.width = `${pct}%`;
      rangePin.style.left = `${pct}%`;
    }
  }

  // Render Ticker Marquee Tape
  function renderMarquee() {
    if (!marqueeTrack) return;
    const topAssets = watchlist.slice(0, 10);
    const html = topAssets.map(item => {
      const q = currentPrices[item.id];
      const p = q ? parseFloat(q.lastPrice) : (item.id === 'BTCUSDT' ? 79365.75 : (item.id === 'XAUUSDT' ? 2912.40 : 100));
      const c = q ? parseFloat(q.priceChangePercent) : (item.id === 'BTCUSDT' ? 0.78 : (item.id === 'XAUUSDT' ? 0.85 : 0.00));
      const isUp = c >= 0;
      const decimals = item.precision !== undefined ? Math.min(item.precision, 2) : 2;
      return `<div class="ticker-item" data-id="${item.id}" title="Click to view ${item.symbol}"><span class="ticker-sym">${item.symbol}</span><span class="ticker-val">${formatMoney(p, decimals)}</span><span class="ticker-delta ${isUp ? 'up' : 'down'}">${isUp ? '+' : ''}${c.toFixed(2)}%</span></div>`;
    }).join('');

    marqueeTrack.innerHTML = html + html;

    marqueeTrack.querySelectorAll('.ticker-item').forEach(el => {
      el.addEventListener('click', () => {
        activeHeroId = el.dataset.id;
        const termTabBtn = document.querySelector('.nav-tab-btn[data-tab="terminal"]');
        termTabBtn?.click();
        renderHeroCard();
        loadChartData();
      });
    });
  }

  // Render Screener / Watchlist Rows with Mini SVG Sparklines & Asset Management
  function renderWatchlist() {
    if (!watchlistContainer) return;
    const search = (screenerSearch?.value || '').toLowerCase();
    const filter = screenerTypeFilter?.value || 'all';

    const filtered = watchlist.filter(item => {
      const matchesSearch = !search || `${item.symbol} ${item.name}`.toLowerCase().includes(search);
      const matchesType = filter === 'all' || item.type === filter;
      return matchesSearch && matchesType;
    });

    if (!filtered.length) {
      watchlistContainer.innerHTML = '<div class="empty-state">No matching assets found.</div>';
      return;
    }

    watchlistContainer.innerHTML = filtered.map((item, index) => {
      const isPinned = item.id === pinnedId;
      const q = currentPrices[item.id];
      const p = q ? parseFloat(q.lastPrice) : null;
      const c = q ? parseFloat(q.priceChangePercent) : 0;
      const isUp = c >= 0;
      const sparkSvg = generateSparklineSvg(item.id, isUp);

      return `
        <div class="asset-row ${isPinned ? 'pinned' : ''}" data-id="${item.id}" data-index="${index}" draggable="true">
          <div class="asset-left">
            <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
            <button class="asset-pin-btn ${isPinned ? 'active' : ''}" data-pin="${item.id}" title="Pin to browser badge (${formatBadgeText(p, c, badgeMode)})">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="${isPinned ? '#f59e0b' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </button>
            <div class="asset-info">
              <span class="asset-symbol">${item.symbol}</span>
              <span class="asset-name">${item.name}</span>
            </div>
          </div>

          <div class="asset-chart-cell">
            ${sparkSvg}
          </div>

          <div class="asset-right">
            <div class="asset-price-block">
              <span class="asset-price">${formatMoney(p)}</span>
              <span class="asset-delta ${isUp ? 'up' : 'down'}">${isUp ? '+' : ''}${c.toFixed(2)}%</span>
            </div>
            <button class="asset-del-row-btn" data-remove-asset="${item.id}" title="Remove ${item.symbol} from Watchlist">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach row click to inspect in terminal hero
    watchlistContainer.querySelectorAll('.asset-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.asset-pin-btn') || e.target.closest('.drag-handle') || e.target.closest('.asset-del-row-btn')) return;
        activeHeroId = row.dataset.id;
        renderHeroCard();
        loadChartData();

        const termTabBtn = document.querySelector('.nav-tab-btn[data-tab="terminal"]');
        termTabBtn?.click();
      });
    });

    // Pin Button Handler
    watchlistContainer.querySelectorAll('.asset-pin-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        pinnedId = btn.dataset.pin;
        await UniversalStorage.set({ [CONFIG.STORAGE_KEYS.pinnedAsset]: pinnedId });
        updateLiveBadge();
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ action: 'refresh_now' });
        }
        renderWatchlist();
        renderHeroCard();
        playChime('success');
      });
    });

    // Remove Asset from Watchlist Handler
    watchlistContainer.querySelectorAll('.asset-del-row-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const assetId = btn.dataset.removeAsset;
        if (!assetId) return;
        if (watchlist.length <= 1) {
          alert('Watchlist must contain at least 1 asset.');
          return;
        }
        watchlist = watchlist.filter(w => w.id !== assetId);
        if (pinnedId === assetId) {
          pinnedId = watchlist[0].id;
          await UniversalStorage.set({ [CONFIG.STORAGE_KEYS.pinnedAsset]: pinnedId });
        }
        if (activeHeroId === assetId) {
          activeHeroId = watchlist[0].id;
        }
        await UniversalStorage.set({ [CONFIG.STORAGE_KEYS.watchlist]: watchlist });
        populateDropdowns();
        renderWatchlist();
        renderHeroCard();
        renderMarquee();
        playChime('success');
      });
    });
  }

  // Generate SVG Sparkline string
  function generateSparklineSvg(assetId, isUp) {
    const stroke = isUp ? '#10b981' : '#f43f5e';
    const points = [];
    const count = 12;
    let val = 100;
    for (let i = 0; i < count; i++) {
      val += (Math.random() - (isUp ? 0.45 : 0.55)) * 6;
      points.push(val);
    }
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = (max - min) || 1;
    const w = 65, h = 26;
    const coords = points.map((p, i) => `${(i / (count - 1)) * w},${h - ((p - min) / span) * (h - 4) - 2}`);
    return `
      <svg class="mini-sparkline" viewBox="0 0 ${w} ${h}">
        <polyline fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" points="${coords.join(' ')}" />
      </svg>
    `;
  }

  // Render Portfolio, Holdings with Edit/Delete Actions, and Donut Allocation
  function renderPortfolio() {
    let totalValue = 0;
    let totalCost = 0;
    let dayPnlDollars = 0;

    const enriched = holdings.map(h => {
      const asset = watchlist.find(w => w.id === h.id);
      const quote = currentPrices[h.id];
      const curPrice = quote ? parseFloat(quote.lastPrice) : (h.buyPrice || 100);
      const change24 = quote ? parseFloat(quote.priceChangePercent) : 0;
      const value = h.amount * curPrice;
      const cost = h.amount * h.buyPrice;
      const pnl = value - cost;
      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;

      totalValue += value;
      totalCost += cost;
      dayPnlDollars += (value * (change24 / 100));

      return { ...h, symbol: asset?.symbol || h.id, name: asset?.name || '', curPrice, value, cost, pnl, pnlPct };
    });

    const allTimePnl = totalValue - totalCost;
    const allTimePnlPct = totalCost > 0 ? (allTimePnl / totalCost) * 100 : 0;
    const dayPnlPct = totalValue > 0 ? (dayPnlDollars / totalValue) * 100 : 0;

    if (portfolioTotalVal) portfolioTotalVal.textContent = formatMoney(totalValue);
    if (portfolio24hPnl) {
      const up = dayPnlDollars >= 0;
      portfolio24hPnl.textContent = `${up ? '+' : ''}${formatMoney(dayPnlDollars)} (${up ? '+' : ''}${dayPnlPct.toFixed(2)}%)`;
      portfolio24hPnl.style.color = up ? 'var(--bull)' : 'var(--bear)';
    }
    if (portfolioAllTimePnl) {
      const up = allTimePnl >= 0;
      portfolioAllTimePnl.textContent = `${up ? '+' : ''}${formatMoney(allTimePnl)} (${up ? '+' : ''}${allTimePnlPct.toFixed(2)}%)`;
      portfolioAllTimePnl.style.color = up ? 'var(--bull)' : 'var(--bear)';
    }

    // Render Holdings Rows with Edit and Delete Action Buttons
    if (holdingsListContainer) {
      if (!enriched.length) {
        holdingsListContainer.innerHTML = '<div class="empty-state">No assets tracked yet. Click "Track Asset" to add how much you have!</div>';
      } else {
        holdingsListContainer.innerHTML = enriched.map((h) => {
          const up = h.pnl >= 0;
          const unitsDisplay = h.amount < 0.01 ? h.amount.toFixed(6) : (h.amount < 1 ? h.amount.toFixed(4) : h.amount.toFixed(2));
          return `
            <div class="holding-row" data-holding-id="${h.id}">
              <div class="holding-left">
                <span class="holding-sym">${h.symbol}</span>
                <span class="holding-qty">${unitsDisplay} units @ ${formatMoney(h.buyPrice)} at entry</span>
              </div>
              <div class="holding-center-right">
                <div class="holding-right">
                  <span class="holding-val">${formatMoney(h.value)}</span>
                  <span class="holding-pnl ${up ? 'up' : 'down'}">
                    ${up ? '+' : ''}${formatMoney(h.pnl)} (${up ? '+' : ''}${h.pnlPct.toFixed(2)}%)
                  </span>
                </div>
                <div class="holding-actions">
                  <button class="btn-holding-action edit" data-edit-id="${h.id}" title="Edit / Update ${h.symbol}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button class="btn-holding-action del" data-del-id="${h.id}" title="Remove ${h.symbol} Holding">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('');

        // Attach Edit Holding Handlers
        holdingsListContainer.querySelectorAll('.btn-holding-action.edit').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = btn.dataset.editId;
            const item = holdings.find(h => h.id === targetId);
            if (!item) return;

            const asset = watchlist.find(w => w.id === item.id);
            const curPrice = getAssetPrice(item.id);

            if (holdingModalTitleText) {
              holdingModalTitleText.textContent = `Update Asset: ${asset?.symbol || item.id}`;
            }
            if (confirmAddHoldingBtn) {
              confirmAddHoldingBtn.textContent = 'Update Asset';
            }
            if (editingHoldingId) {
              editingHoldingId.value = item.id;
            }
            if (holdingAssetSelect) {
              holdingAssetSelect.value = item.id;
              holdingAssetSelect.disabled = true;
            }
            if (holdingUsdAmountInput) {
              holdingUsdAmountInput.value = (item.amount * curPrice).toFixed(2);
            }
            if (holdingAmountInput) {
              holdingAmountInput.value = item.amount;
            }
            if (holdingBuyPriceInput) {
              holdingBuyPriceInput.value = item.buyPrice;
            }

            modeUsdBtn?.click();
            updateHoldingPreview();
            addHoldingModal?.classList.add('active');
            setTimeout(() => holdingUsdAmountInput?.focus(), 100);
          });
        });

        // Attach Delete Holding Handlers
        holdingsListContainer.querySelectorAll('.btn-holding-action.del').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const targetId = btn.dataset.delId;
            const item = holdings.find(h => h.id === targetId);
            if (!item) return;

            holdings = holdings.filter(h => h.id !== targetId);
            await UniversalStorage.set({ [CONFIG.STORAGE_KEYS.portfolio]: holdings });
            renderPortfolio();
            playChime('success');
          });
        });
      }
    }

    // Render Donut Chart & Legend
    if (portfolioDonutSvg && donutLegend) {
      const colors = ['#f59e0b', '#06b6d4', '#8b5cf6', '#10b981', '#f43f5e', '#ec4899', '#3b82f6'];
      let cumulativePercent = 0;
      let svgCircles = '';
      let legendHtml = '';

      if (totalValue <= 0) {
        portfolioDonutSvg.innerHTML = '<circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4"></circle>';
        donutLegend.innerHTML = '<div style="color:var(--text-tertiary);">No active assets</div>';
        return;
      }

      enriched.forEach((item, idx) => {
        const pct = (item.value / totalValue) * 100;
        const color = colors[idx % colors.length];
        const dashArray = `${pct} ${100 - pct}`;
        const dashOffset = 100 - cumulativePercent;

        svgCircles += `
          <circle cx="18" cy="18" r="14" fill="none" stroke="${color}" stroke-width="4"
            stroke-dasharray="${dashArray}" stroke-dashoffset="${dashOffset}"></circle>
        `;
        cumulativePercent += pct;

        legendHtml += `
          <div class="legend-item">
            <div><span class="legend-dot" style="background:${color}"></span><span class="legend-sym">${item.symbol}</span></div>
            <span class="legend-pct">${pct.toFixed(1)}%</span>
          </div>
        `;
      });

      portfolioDonutSvg.innerHTML = svgCircles;
      donutLegend.innerHTML = legendHtml;
    }
  }

  // Render Alerts
  function renderAlerts() {
    if (!activeAlertsList) return;
    if (!alerts.length) {
      activeAlertsList.innerHTML = '<div class="empty-state">No price alerts configured.</div>';
      return;
    }

    activeAlertsList.innerHTML = alerts.map((a, i) => {
      const asset = watchlist.find(w => w.id === a.symbol);
      const isTriggered = a.triggered;
      return `
        <div class="alert-card">
          <div class="alert-desc">
            <span style="color: ${isTriggered ? 'var(--accent-gold)' : 'var(--accent-cyan)'};">${isTriggered ? '🔔' : '⏱️'}</span>
            <span>${asset?.symbol || a.symbol} ${a.condition === 'above' ? '≥' : '≤'} ${formatMoney(a.target)}</span>
          </div>
          <button class="alert-del-btn" data-del="${i}" title="Remove Alert">✕</button>
        </div>
      `;
    }).join('');

    activeAlertsList.querySelectorAll('.alert-del-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.del);
        alerts.splice(idx, 1);
        await UniversalStorage.set({ [CONFIG.STORAGE_KEYS.alerts]: alerts });
        renderAlerts();
      });
    });
  }

  // Check Alerts Engine
  function evaluateAlerts() {
    let changed = false;
    for (const a of alerts) {
      if (!a.triggered) {
        const quote = currentPrices[a.symbol];
        if (!quote) continue;
        const price = parseFloat(quote.lastPrice);
        if ((a.condition === 'above' && price >= a.target) ||
            (a.condition === 'below' && price <= a.target)) {
          a.triggered = true;
          changed = true;
          playChime('alert');

          if (typeof chrome !== 'undefined' && chrome.notifications && chrome.notifications.create) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/finance-hud.svg',
              title: `🔔 Price Alert Reached: ${a.symbol}`,
              message: `${a.symbol} has crossed your threshold of ${formatMoney(a.target)} (Current: ${formatMoney(price)})`,
              priority: 2
            });
          }
        }
      }
    }
    if (changed) {
      UniversalStorage.set({ [CONFIG.STORAGE_KEYS.alerts]: alerts });
      renderAlerts();
    }
  }

  // Render Order Depth Simulation (for dashboard.html)
  function renderOrderDepth() {
    const orderBookList = document.getElementById('orderBookList');
    if (!orderBookList) return;
    const heroQuote = currentPrices[activeHeroId];
    const basePrice = heroQuote ? parseFloat(heroQuote.lastPrice) : 2914.00;

    let bids = [];
    let asks = [];
    for (let i = 1; i <= 3; i++) {
      bids.push({ price: basePrice - i * (basePrice * 0.0008), amount: (Math.random() * 4 + 1).toFixed(2) });
      asks.push({ price: basePrice + i * (basePrice * 0.0008), amount: (Math.random() * 4 + 1).toFixed(2) });
    }

    orderBookList.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 3px;">
        ${asks.reverse().map(a => `
          <div class="depth-row">
            <div class="depth-bar-ask" style="width: ${Math.min(100, a.amount * 18)}%;"></div>
            <div class="depth-content">
              <span style="color: var(--bear);">${formatMoney(a.price)}</span>
              <span style="color: var(--text-tertiary);">${a.amount}</span>
            </div>
          </div>
        `).join('')}
        <div style="border-top: 1px dashed var(--border-medium); margin: 3px 0;"></div>
        ${bids.map(b => `
          <div class="depth-row">
            <div class="depth-bar-bid" style="width: ${Math.min(100, b.amount * 18)}%;"></div>
            <div class="depth-content">
              <span style="color: var(--bull);">${formatMoney(b.price)}</span>
              <span style="color: var(--text-tertiary);">${b.amount}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Master Render
  function renderAllViews() {
    renderHeroCard();
    renderMarquee();
    renderWatchlist();
    renderPortfolio();
    renderAlerts();
    renderOrderDepth();
    renderChart();
    updateLiveBadge();
  }

  // Full Refresh Pipeline
  async function refreshAll() {
    if (refreshIcon) refreshIcon.style.animation = 'pulse-radar 0.8s infinite';

    try {
      const pricePromises = watchlist.map(async item => [item.id, await fetchTicker(item)]);
      const entries = await Promise.all(pricePromises);
      currentPrices = Object.fromEntries(entries);

      await UniversalStorage.set({ ft_latest_prices: currentPrices, ft_last_updated: Date.now() });

      renderAllViews();
      await loadChartData();
      evaluateAlerts();

      if (lastUpdatedText) {
        lastUpdatedText.textContent = `Updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
      }
      playChime('success');
    } catch (err) {
      console.warn('Refresh error:', err);
    } finally {
      if (refreshIcon) refreshIcon.style.animation = 'none';
    }
  }

  function mergeDefaultWatchlist(saved) {
    if (!Array.isArray(saved) || !saved.length) return CONFIG.DEFAULT_WATCHLIST;
    const ids = new Set(saved.map(s => s.id));
    return [...saved, ...CONFIG.DEFAULT_WATCHLIST.filter(w => !ids.has(w.id))];
  }

  // Initial Launch
  await refreshAll();

  // Polling Interval
  setInterval(() => {
    refreshAll();
  }, (stored[CONFIG.STORAGE_KEYS.refreshInterval] || 1) * 60 * 1000);
});
