# Finance Tracker & Ticker HUD — Implementation Blueprint & Architecture Plan

A lightweight Chrome extension (Manifest V3) engineered for traders and investors to monitor live Gold (XAU/USD), Bitcoin (BTC/USD), SP500, and JP yen without keeping heavy exchange tabs or desktop terminals open.

---

## 1. Core Objectives
1. **Live Browser Badge HUD**: Displays real-time price or 24h percentage change of your favorite asset directly on the extension icon in Chrome's toolbar.
2. **Background Polling with Zero CPU Waste**: Uses `chrome.alarms` to fetch prices in the service worker at configurable intervals (1 min, 5 min, etc) without running persistent background page loops.
3. **Multi-Asset Watchlist**: Tracks Gold, Bitcoin, SP500, Japanese yen with live 24h high/low and price change badges.
4. **Desktop Price Alerts**: Uses `chrome.notifications` to fire native alerts when an asset crosses above or below user-specified price thresholds.
5. **Lightweight & Privacy-First**: 100% client-side, zero user tracking, no API keys required for public endpoints.

---

## 2. Technical Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Public Price APIs                    │
│   (Binance 24hr Ticker, CoinGecko, Yahoo Finance)      │
└──────────────────────────┬─────────────────────────────┘
                           │ 1. Scheduled fetch (chrome.alarms)
                           ▼
┌────────────────────────────────────────────────────────┐
│                     background.js                      │
│                 (Service Worker MV3)                   │
│  - Executes 1-minute alarm poll                        │
│  - Calculates 4-char badge text ($2.9k / +1.2%)        │
│  - Sets badge background (Green #16a34a / Red #dc2626) │
│  - Evaluates threshold alerts -> chrome.notifications , if defined by the user │
│  - Stores latest state in chrome.storage.local         │
└──────────────────────────┬─────────────────────────────┘
                           │ 2. Reads live cache & config
                           ▼
┌────────────────────────────────────────────────────────┐
│                     popup.html/js                      │
│  - Big Pinned Asset hero card                          │
│  - Dynamic watchlist cards with live green/red pills   │
│  - 1-click Pin-to-Toolbar button (⭐)                  │
│  - Badge display mode toggle ($ vs %)                  │
│  - Manual instant refresh button                       │
└────────────────────────────────────────────────────────┘
```

---

## 3. Badge Constraints & Compact Number Formatting

Chrome's extension badge only fits **4 characters** comfortably before truncating:
- Numbers >= 1,000: Format with `k` suffix (e.g. `$2,912` -> `2.9k`, `$89,400` -> `89k`).
- Numbers < 1,000: Format integer (e.g. `645`).
- Percentage Mode: Format with sign and 1 decimal place (e.g. `+1.8%` or `-3.2%`).
- Dynamic Color: Green background (`#16a34a`) when `priceChangePercent >= 0`, Red (`#dc2626`) when `< 0`.

---

## 4. Asset Data Sources

| Asset | Primary Endpoint | Fallback Endpoint |
|---|---|---|
| **Gold (XAU/USD)** | Binance `PAXGUSDT` (1:1 physical gold-backed token) | Yahoo Finance `GC=F` |
| **Bitcoin (BTC)** | Binance `BTCUSDT` | CoinGecko API |
| **SP500 (tbd)** | Binance `TDB-USD` | TBD API |
| **jp YEN (tbd)** | Binance `tbd` | tbd API |
| **Euro (EUR/USD)** | Binance `EURUSDT` | Yahoo Finance `EURUSD=X` |

---

## 5. Roadmap & Implementation Phases

- [x] **Phase 1: Project Scaffold** — Manifest V3, background alarms, live toolbar badge, popup UI.
- [ ] **Phase 2: Sparkline Charts** — Inline SVG price charts (1D / 7D) rendered without external JS libraries.
- [ ] **Phase 3: Custom Asset Modal** — Add any coin or pair by typing its symbol (e.g. `DOGE`, `ADA`, `SILVER`).
- [ ] **Phase 4: Trading Signals** — Simple moving average (MA20/MA50) and RSI overbought/oversold indicators.
