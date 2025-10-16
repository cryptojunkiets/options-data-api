# Options Chain API

A free, daily-updated options chain data API served via GitHub Pages.

## 📊 Current Statistics
- **Symbols:** 1528
- **Total Contracts:** 111437
- **Data Date:** 2025-10-15
- **Last Updated:** 2025-10-16T07:16:23.505Z

## 🚀 API Endpoints

### Base URL
`https://cryptojunkiets.github.io/options-data-api/`

### Endpoints
- `GET /symbols.json` - List of all available symbols
- `GET /symbols/{SYMBOL}.json` - All contracts for a specific symbol
- `GET /metadata.json` - Dataset metadata and statistics

## 📖 Usage Examples

```bash
# Get all available symbols
curl https://cryptojunkiets.github.io/options-data-api/symbols.json

# Get AAPL options
curl https://cryptojunkiets.github.io/options-data-api/symbols/AAPL.json

# Get metadata
curl https://cryptojunkiets.github.io/options-data-api/metadata.json
```

## 🔄 Update Schedule
Data is automatically updated every weekday at 3 AM UTC using GitHub Actions.

## 📁 Data Structure
Each option contract includes:
- Basic info: symbol, expiration, strike, type (call/put)
- Pricing: bid, ask
- Volume and Greeks: volume, delta, gamma, theta, vega, rho

## 🛠️ Technical Details
- **Data Source:** [post-no-preference/options](https://www.dolthub.com/repositories/post-no-preference/options) Dolt database
- **Processing:** TypeScript with GitHub Actions
- **Hosting:** GitHub Pages (free tier)
- **Update Frequency:** Weekdays only

## ⚡ Performance
- Individual symbol files are optimized for size
- Data is compressed and cached
- Only active contracts (bid > 0 OR ask > 0) are included

## 📝 License
This data is provided for educational and research purposes. Please ensure compliance with your intended usage.

---
*Generated automatically by GitHub Actions*
