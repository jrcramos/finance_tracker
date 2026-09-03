// Configuration for Finance Tracker & Ticker HUD
const CONFIG = {
  DEFAULT_WATCHLIST: [
    { id: 'XAUUSDT', symbol: 'XAU/USD', name: 'Gold Spot', type: 'commodity', pinned: true, badgeMode: 'price' },
    { id: 'GC_F', symbol: 'GC=F', name: 'Gold Futures', type: 'commodity', pinned: false, provider: 'yahoo', yahooSymbol: 'GC=F' },
    { id: 'BTCUSDT', symbol: 'BTC/USD', name: 'Bitcoin', type: 'crypto', pinned: false },
    { id: 'ETHUSDT', symbol: 'ETH/USD', name: 'Ethereum', type: 'crypto', pinned: false },
    { id: 'SOLUSDT', symbol: 'SOL/USD', name: 'Solana', type: 'crypto', pinned: false },
    { id: 'EURUSDT', symbol: 'EUR/USD', name: 'Euro / USD', type: 'forex', pinned: false },
    { id: 'SP500', symbol: 'SP500', name: 'S&P 500', type: 'index', pinned: false, provider: 'yahoo', yahooSymbol: '^GSPC' },
    { id: 'JPYUSD', symbol: 'JPY/USD', name: 'Japanese Yen', type: 'forex', pinned: false, provider: 'yahoo', yahooSymbol: 'JPY=X' },
    { id: 'DXY', symbol: 'DXY', name: 'US Dollar Index', type: 'forex', pinned: false, provider: 'yahoo', yahooSymbol: 'DX-Y.NYB' }
  ],
  STORAGE_KEYS: {
    watchlist: 'ft_watchlist',
    pinnedAsset: 'ft_pinned_asset',
    badgeMode: 'ft_badge_mode', // 'price' or 'change'
    chartRange: 'ft_chart_range', // '1d', '7d', '1m', '3m', '1y'
    refreshInterval: 'ft_refresh_interval', // in minutes
    alerts: 'ft_price_alerts',
    theme: 'ft_theme'
  },
  DEFAULT_REFRESH_MINUTES: 1,
  APIS: {
    binanceTicker: 'https://api.binance.com/api/v3/ticker/24hr?symbol=',
    binanceKlines: 'https://api.binance.com/api/v3/klines',
    yahooChart: 'https://query1.finance.yahoo.com/v8/finance/chart/'
  },
  DEFAULT_PINNED_ASSET: 'XAUUSDT',
  DEFAULT_BADGE_MODE: 'price'
};

if (typeof module !== 'undefined') module.exports = CONFIG;
