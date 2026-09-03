// Configuration for Finance Tracker & Ticker HUD
const CONFIG = {
  DEFAULT_WATCHLIST: [
    { id: 'XAUUSDT', symbol: 'XAU/USD', name: 'Gold Spot', type: 'commodity', pinned: true },
    { id: 'BTCUSDT', symbol: 'BTC/USD', name: 'Bitcoin', type: 'crypto', pinned: false },
    { id: 'ETHUSDT', symbol: 'ETH/USD', name: 'Ethereum', type: 'crypto', pinned: false },
    { id: 'SOLUSDT', symbol: 'SOL/USD', name: 'Solana', type: 'crypto', pinned: false },
    { id: 'EURUSDT', symbol: 'EUR/USD', name: 'Euro / USD', type: 'forex', pinned: false }
  ],
  STORAGE_KEYS: {
    watchlist: 'ft_watchlist',
    pinnedAsset: 'ft_pinned_asset',
    badgeMode: 'ft_badge_mode', // 'price' or 'change'
    refreshInterval: 'ft_refresh_interval', // in minutes
    alerts: 'ft_price_alerts',
    theme: 'theme'
  },
  DEFAULT_REFRESH_MINUTES: 1,
  APIS: {
    binanceTicker: 'https://api.binance.com/api/v3/ticker/24hr?symbol=',
    binanceKlines: 'https://api.binance.com/api/v3/klines'
  }
};

if (typeof module !== 'undefined') module.exports = CONFIG;
