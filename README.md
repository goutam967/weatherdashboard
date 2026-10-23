# SkyCast — iOS 18 Weather Dashboard

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

An ultra-modern, glassmorphism weather dashboard inspired by iOS 18 design aesthetics, fully configured and optimized for zero-configuration deployment to **[Vercel](https://vercel.com)**.

---

## ✨ Features

- 🌤 **Real-Time Weather**: Current temperature, highs/lows, condition icon, humidity, and wind speed.
- ⏱ **Hourly Forecast**: Dynamic horizontal scroll of hourly predictions.
- 📅 **5-Day Forecast**: Extended weather outlook with daily high/low temperatures.
- 🔮 **Smart Atmospheric Predictions**: Trend analysis for temperature shifts, rain probability, wind variance, and pressure.
- ☀️ **Sun & Moon Tracker**: Live sunrise and sunset calculations.
- 🌿 **Air Quality & UV Index**: AQI rating and UV exposure warnings.
- 🌌 **Dynamic Visual FX & Neural Starfield**: Interactive particle network with cursor gravitation and animated sky backgrounds.
- 🌓 **iOS 18 Dark / Light Mode**: Smooth theme toggling with persistent user preference.
- 📱 **Progressive Web App (PWA)**: Installable on iOS, Android, and Desktop with offline caching.
- ⚡ **Vercel Serverless API**: Serverless `/api/weather` and `/api/forecast` endpoints that protect API keys, enable edge caching, and reduce upstream rate limits.

---

## 🚀 Deploying to Vercel

### Option 1: One-Click Deploy via Vercel Web Dashboard

1. Push your repository to **GitHub**, **GitLab**, or **Bitbucket**.
2. Go to **[vercel.com/new](https://vercel.com/new)** and import your repository.
3. In **Environment Variables**, add:
   - `OPENWEATHER_API_KEY` = `your_api_key_here` *(Optional: SkyCast includes a built-in default fallback)*
4. Click **Deploy**. Vercel will automatically build and host your site on global edge nodes with free SSL.

---

### Option 2: Deploy via Vercel CLI

1. Install the Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Run the deployment command in the project directory:
   ```bash
   vercel
   ```

3. To deploy to production:
   ```bash
   vercel --prod
   ```

---

## ⚙️ Environment Variables

Configure these in the Vercel dashboard under **Project Settings → Environment Variables**:

| Variable | Description | Default / Fallback |
| :--- | :--- | :--- |
| `OPENWEATHER_API_KEY` | Your OpenWeatherMap API key | Built-in fallback key |

---

## 🛠 Local Development

You can run the project locally with the Vercel development server:

```bash
# Using Vercel CLI (simulates Edge Serverless Functions)
vercel dev

# Or with any static web server
npx serve .
```

---

## 📁 Project Structure

```
├── api/
│   ├── weather.js        # Vercel serverless endpoint for current weather
│   ├── forecast.js       # Vercel serverless endpoint for 5-day forecast
│   └── health.js         # Health check endpoint (/api/health)
├── favicon.svg           # Scalable vector app icon
├── icon.png              # 192x192 PWA app icon
├── icon-512.png          # 512x512 PWA app icon
├── index.html            # Main HTML application
├── manifest.json         # PWA Web App Manifest
├── package.json          # Project metadata & npm scripts
├── script.js             # Frontend logic, neural animations & API client
├── service-worker.js     # Production offline caching service worker
├── style.css             # iOS 18 glassmorphic styles & micro-animations
├── vercel.json           # Vercel deployment configuration & security headers
├── .env.example          # Environment variable template
└── .gitignore            # Git exclusion rules
```

---

## 🔒 Security & Performance Features

- **Edge Caching**: Weather responses are cached on Vercel's global CDN (`s-maxage=600`), minimizing API credit usage.
- **Security Headers**: Pre-configured HTTP headers in `vercel.json` (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
- **Clean URLs**: Clean routing enabled without `.html` extensions.
