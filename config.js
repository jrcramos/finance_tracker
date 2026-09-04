// Configuration & Universal Data Engine for Finance Terminal & HUD
const CONFIG = {
  DEFAULT_WATCHLIST: [
    { id: 'XAUUSDT', symbol: 'XAU/USD', name: 'Gold Spot', type: 'commodity', pinned: true, badgeMode: 'price', precision: 2 },
    { id: 'BTCUSDT', symbol: 'BTC/USD', name: 'Bitcoin', type: 'crypto', pinned: false, badgeMode: 'price', precision: 2 },
    { id: 'ETHUSDT', symbol: 'ETH/USD', name: 'Ethereum', type: 'crypto', pinned: false, badgeMode: 'price', precision: 2 },
    { id: 'SOLUSDT', symbol: 'SOL/USD', name: 'Solana', type: 'crypto', pinned: false, badgeMode: 'price', precision: 2 },
    { id: 'SP500', symbol: 'S&P 500', name: 'S&P 500 Index', type: 'index', pinned: false, provider: 'yahoo', yahooSymbol: '^GSPC', precision: 2 },
    { id: 'QQQ', symbol: 'Nasdaq', name: 'Invesco QQQ / Nasdaq', type: 'index', pinned: false, provider: 'yahoo', yahooSymbol: 'QQQ', precision: 2 },
    { id: 'EURUSDT', symbol: 'EUR/USD', name: 'Euro Spot', type: 'forex', pinned: false, precision: 4 },
    { id: 'JPYUSD', symbol: 'USD/JPY', name: 'Japanese Yen', type: 'forex', pinned: false, provider: 'yahoo', yahooSymbol: 'JPY=X', precision: 2 },
    { id: 'DXY', symbol: 'DXY', name: 'US Dollar Index', type: 'forex', pinned: false, provider: 'yahoo', yahooSymbol: 'DX-Y.NYB', precision: 2 },
    { id: 'WTI_OIL', symbol: 'Crude Oil', name: 'WTI Crude Futures', type: 'commodity', pinned: false, provider: 'yahoo', yahooSymbol: 'CL=F', precision: 2 }
  ],

  // Seed sample portfolio holdings so users immediately experience the rich portfolio dashboard
  DEFAULT_HOLDINGS: [
    { id: 'XAUUSDT', amount: 2.5, buyPrice: 2750.00, notes: 'Physical bars' },
    { id: 'BTCUSDT', amount: 0.35, buyPrice: 72400.00, notes: 'Cold wallet' },
    { id: 'ETHUSDT', amount: 3.2, buyPrice: 2850.00, notes: 'Staking' },
    { id: 'SOLUSDT', amount: 15.0, buyPrice: 145.00, notes: 'DeFi bag' }
  ],

  STORAGE_KEYS: {
    watchlist: 'ft_watchlist',
    pinnedAsset: 'ft_pinned_asset',
    badgeMode: 'ft_badge_mode', // 'price' or 'change'
    chartRange: 'ft_chart_range', // '1h', '24h', '7d', '1m', '1y'
    chartType: 'ft_chart_type', // 'area' or 'candle'
    refreshInterval: 'ft_refresh_interval', // in minutes
    alerts: 'ft_price_alerts',
    portfolio: 'ft_portfolio_holdings',
    currency: 'ft_currency', // 'USD', 'EUR', 'GBP', 'JPY'
    theme: 'ft_theme', // 'obsidian', 'cyber', 'midnight', 'light'
    soundEnabled: 'ft_sound_enabled',
    activeTab: 'ft_active_tab'
  },

  CURRENCIES: {
    USD: { symbol: '$', rate: 1.0, prefix: true },
    EUR: { symbol: '€', rate: 0.92, prefix: true },
    GBP: { symbol: '£', rate: 0.79, prefix: true },
    JPY: { symbol: '¥', rate: 152.4, prefix: true }
  },

  DEFAULT_REFRESH_MINUTES: 1,
  DEFAULT_PINNED_ASSET: 'XAUUSDT',
  DEFAULT_BADGE_MODE: 'price',
  DEFAULT_THEME: 'obsidian',

  APIS: {
    binanceTicker: 'https://api.binance.com/api/v3/ticker/24hr?symbol=',
    binanceKlines: 'https://api.binance.com/api/v3/klines',
    yahooChart: 'https://query1.finance.yahoo.com/v8/finance/chart/',
    fearAndGreed: 'https://api.alternative.me/fng/'
  }
};

/**
 * Universal Storage Adapter:
 * Transparently supports Chrome Extension MV3 storage and browser localStorage with complete fallback.
 */
class UniversalStorage {
  static isChromeStorage() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  }

  static async get(keys) {
    if (this.isChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.get(keys, (res) => resolve(res || {}));
      });
    } else {
      // LocalStorage fallback
      const result = {};
      const keyList = Array.isArray(keys) ? keys : (typeof keys === 'string' ? [keys] : Object.keys(keys || {}));
      for (const k of keyList) {
        try {
          const val = localStorage.getItem(k);
          if (val !== null) {
            result[k] = JSON.parse(val);
          }
        } catch {
          // ignore parsing error
        }
      }
      return result;
    }
  }

  static async set(items) {
    if (this.isChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.set(items, () => resolve());
      });
    } else {
      for (const [k, v] of Object.entries(items)) {
        try {
          localStorage.setItem(k, JSON.stringify(v));
        } catch {
          // ignore quota error
        }
      }
    }
  }
}

// Attach to window or module
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
  window.StorageAdapter = UniversalStorage;
}
if (typeof module !== 'undefined') {
  module.exports = { CONFIG, UniversalStorage };
}
