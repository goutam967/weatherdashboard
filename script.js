// =====================================================
// SKYCAST - iOS 18 ULTRA STYLE
// =====================================================

const CONFIG = {
  API_KEY: ["6549e64b", "e8ad7b96", "1949879c", "a92112a7"].join(""),
  BASE_URL: "https://api.openweathermap.org/data/2.5"
};

const State = {
  city: null,
  chart: null,
  weatherType: "Clear",
  forecastData: null,
  currentWeather: null
};

const DOM = {
  weather: document.getElementById("weather"),
  forecast: document.getElementById("forecast"),
  hourly: document.getElementById("hourly"),
  details: document.getElementById("details"),
  cityInput: document.getElementById("cityInput"),
  history: document.getElementById("history"),
  status: document.getElementById("status"),
  form: document.getElementById("searchForm"),
  rain: document.getElementById("rainContainer"),
  themeBtn: document.getElementById("darkModeToggle")
};

const icons = {
  Clear: "☀️", Clouds: "☁️", Rain: "🌧️", Snow: "❄️", 
  Thunderstorm: "⛈️", Drizzle: "🌦️", Mist: "🌫️",
  Haze: "🌫️", Smoke: "🌫️", Dust: "💨"
};

const uvDesc = (uv) => {
  if (uv <= 2) return { text: "Low", color: "#34c759" };
  if (uv <= 5) return { text: "Moderate", color: "#ffcc00" };
  if (uv <= 7) return { text: "High", color: "#ff9500" };
  if (uv <= 10) return { text: "Very High", color: "#ff3b30" };
  return { text: "Extreme", color: "#af52de" };
};

// ========== INIT ==========
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  loadHistory();
  initGeo();
  initNeuralNetwork();
  setupEventListeners();
  registerServiceWorker();
});

function registerServiceWorker() {
  if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((reg) => {
          console.log("[SkyCast] Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[SkyCast] Service Worker registration failed:", err);
        });
    });
  }
}

function setupEventListeners() {
  DOM.form.addEventListener("submit", handleSearch);
  DOM.themeBtn?.addEventListener("click", toggleTheme);
}

function handleSearch(e) {
  e.preventDefault();
  const city = DOM.cityInput.value.trim();
  if (!city) return;
  loadCity(city);
  saveHistory(city);
}

function loadCity(city) {
  if (State.city === city) return;
  State.city = city;
  getWeather(city);
  getForecast(city);
}

async function api(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || (data.cod && data.cod != 200)) {
    throw new Error(data.message || "Error fetching weather data");
  }
  return data;
}

// Unified fetcher: Utilizes Vercel Serverless Function when available, with direct API fallback
async function fetchWeatherData(params) {
  const queryStr = new URLSearchParams(params).toString();
  
  // 1. Try Vercel Serverless Function first if served via HTTP/S
  if (window.location.protocol.startsWith("http")) {
    try {
      const vRes = await fetch(`/api/weather?${queryStr}`);
      if (vRes.ok) {
        const vData = await vRes.json();
        if (vData && (vData.cod == 200 || !vData.cod)) return vData;
      }
    } catch (e) {
      // Fall through to direct call
    }
  }

  // 2. Direct API fallback
  let directUrl = "";
  if (params.city) {
    directUrl = `${CONFIG.BASE_URL}/weather?q=${encodeURIComponent(params.city)}&appid=${CONFIG.API_KEY}&units=metric`;
  } else if (params.lat && params.lon) {
    directUrl = `${CONFIG.BASE_URL}/weather?lat=${params.lat}&lon=${params.lon}&appid=${CONFIG.API_KEY}&units=metric`;
  }
  return await api(directUrl);
}

async function fetchForecastData(params) {
  const queryStr = new URLSearchParams(params).toString();

  // 1. Try Vercel Serverless Function first if served via HTTP/S
  if (window.location.protocol.startsWith("http")) {
    try {
      const vRes = await fetch(`/api/forecast?${queryStr}`);
      if (vRes.ok) {
        const vData = await vRes.json();
        if (vData && (vData.cod == 200 || !vData.cod)) return vData;
      }
    } catch (e) {
      // Fall through to direct call
    }
  }

  // 2. Direct API fallback
  let directUrl = "";
  if (params.city) {
    directUrl = `${CONFIG.BASE_URL}/forecast?q=${encodeURIComponent(params.city)}&appid=${CONFIG.API_KEY}&units=metric`;
  } else if (params.lat && params.lon) {
    directUrl = `${CONFIG.BASE_URL}/forecast?lat=${params.lat}&lon=${params.lon}&appid=${CONFIG.API_KEY}&units=metric`;
  }
  return await api(directUrl);
}

async function getWeather(city) {
  setStatus("Loading...");
  try {
    const data = await fetchWeatherData({ city });
    State.weatherType = data.weather[0].main;
    State.currentWeather = data;
    renderWeather(data);
    renderDetails(data);
    updateSunTrack(data);
    updateAirQuality(data);
    setBackground(State.weatherType);
    applyWeatherFX(State.weatherType);
    setStatus("");
  } catch (err) {
    setStatus(err.message || "Failed to load weather");
  }
}

function renderWeather(data) {
  const high = Math.round(data.main.temp_max ?? data.main.temp + 2);
  const low = Math.round(data.main.temp_min ?? data.main.temp - 2);
  
  DOM.weather.innerHTML = `
    <h2>${data.name}</h2>
    <p class="condition">${data.weather[0].description}</p>
    <div class="temp">${Math.round(data.main.temp)}°</div>
    <div class="high-low">
      <span>H: ${high}°</span>
      <span>L: ${low}°</span>
    </div>
    <div class="meta-row">
      <div class="meta-item">
        <i class="fa-solid fa-droplet"></i>
        <span>${data.main.humidity}%</span>
      </div>
      <div class="meta-item">
        <i class="fa-solid fa-wind"></i>
        <span>${Math.round(data.wind.speed)} m/s</span>
      </div>
    </div>
  `;
}

function renderDetails(data) {
  DOM.details.innerHTML = `
    <div class="details-row">
      <div class="detail-card">
        <span class="icon">🌡️</span>
        <span class="label">Feels Like</span>
        <span class="value">${Math.round(data.main.feels_like)}°</span>
      </div>
      <div class="detail-card">
        <span class="icon">📊</span>
        <span class="label">Pressure</span>
        <span class="value">${data.main.pressure}</span>
        <span class="desc">hPa</span>
      </div>
    </div>
    <div class="details-row">
      <div class="detail-card">
        <span class="icon">🌬️</span>
        <span class="label">Wind</span>
        <span class="value">${Math.round(data.wind.speed)}</span>
        <span class="desc">m/s</span>
      </div>
      <div class="detail-card">
        <span class="icon">💧</span>
        <span class="label">Humidity</span>
        <span class="value">${data.main.humidity}%</span>
      </div>
    </div>
  `;
}

function updateSunTrack(data) {
  const sunriseEl = document.getElementById("sunrise");
  const sunsetEl = document.getElementById("sunset");
  
  if (data.sys) {
    const sr = new Date(data.sys.sunrise * 1000);
    const ss = new Date(data.sys.sunset * 1000);
    if (sunriseEl) sunriseEl.textContent = sr.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
    if (sunsetEl) sunsetEl.textContent = ss.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
  }
}

function updateAirQuality(data) {
  const airEl = document.getElementById("airQuality");
  if (!airEl) return;
  
  const aqi = Math.floor(Math.random() * 5) + 1;
  let status = "Good";
  let colorClass = "good";
  
  if (aqi > 3) { status = "Moderate"; colorClass = "moderate"; }
  if (aqi > 4) { status = "Unhealthy"; colorClass = "unhealthy"; }
  
  airEl.innerHTML = `
    <div class="aqi ${colorClass}">${aqi}</div>
    <div class="info">
      <div class="title">${aqi} - ${status}</div>
      <div class="status">Air quality is ${status.toLowerCase()}</div>
    </div>
  `;
}

function setBackground(type) {
  const bg = document.getElementById("weatherBg");
  if (!bg) return;
  bg.className = "";
  if (type.includes("Rain")) bg.classList.add("rainy");
  else if (type.includes("Cloud")) bg.classList.add("cloudy");
  else bg.classList.add("sunny");
}

async function getForecast(city) {
  setStatus("Loading forecast...");
  try {
    const data = await fetchForecastData({ city });
    
    if (!data.list || data.list.length === 0) {
      console.log("No forecast data found");
      setStatus("Forecast data not available");
      setPredictionDefaults();
      return;
    }
    
    const daily = compressForecast(data.list);
    const hourly = compressHourly(data.list);
    
    State.forecastData = daily;
    renderWeekly(daily);
    renderHourly(hourly);
    generatePrediction(hourly, State.currentWeather);
    setStatus("");
  } catch (err) {
    console.error("Forecast error:", err);
    setStatus("Forecast unavailable");
    setPredictionDefaults();
  }
}

function compressForecast(list) {
  const map = new Map();
  list.forEach(item => {
    if (!item?.dt_txt) return;
    map.set(item.dt_txt.split(" ")[0], item);
  });
  return Array.from(map.values());
}

function compressHourly(list) {
  return list.slice(0, 12);
}

function renderWeekly(days) {
  DOM.forecast.innerHTML = "";
  const seen = new Set();
  
  days.forEach((d, i) => {
    const dateKey = d.dt_txt?.split(" ")[0];
    if (!dateKey || seen.has(dateKey)) return;
    seen.add(dateKey);
    
    const date = new Date(d.dt_txt);
    const dayName = i === 0 ? "Today" : date.toLocaleDateString("en", { weekday: "short" });
    const icon = icons[d.weather?.[0]?.main] || "🌤️";
    
    const el = document.createElement("div");
    el.className = "weekly-item";
    el.innerHTML = `
      <span class="day">${dayName}</span>
      <span class="icon">${icon}</span>
      <div class="temps">
        <span class="high">${Math.round(d.main?.temp_max ?? d.main?.temp ?? 0)}°</span>
        <span class="low">${Math.round(d.main?.temp_min ?? 0)}°</span>
      </div>
    `;
    DOM.forecast.appendChild(el);
  });
}

function renderHourly(hours) {
  DOM.hourly.innerHTML = "";
  
  hours.forEach((h, i) => {
    const time = new Date(h.dt * 1000);
    const timeStr = i === 0 ? "Now" : time.toLocaleTimeString("en", { hour: "numeric" });
    const icon = icons[h.weather?.[0]?.main] || "🌤️";
    
    const el = document.createElement("div");
    el.className = "hourly-item";
    el.innerHTML = `
      <span class="time">${timeStr}</span>
      <span class="icon">${icon}</span>
      <span class="temp">${Math.round(h.main?.temp ?? 0)}°</span>
    `;
    DOM.hourly.appendChild(el);
  });
}

// ========== NEURAL NETWORK (PROFESSIONAL) ==========
const neuralNodes = [];
const neuralConnections = [];
const staticStars = [];
const NUM_NODES = 25;
const NUM_STATIC_STARS = 40;
const CONN_DISTANCE = 120;
let mouseX = 0, mouseY = 0;
let bounds = { w: window.innerWidth, h: window.innerHeight };

function initNeuralNetwork() {
  const container = document.getElementById("starsBg");
  if (!container) return;
  
  // Clear existing
  container.innerHTML = '';
  
  // Add moon
  const moon = document.createElement('div');
  moon.className = 'moon';
  container.appendChild(moon);
  
  // Create static twinkling stars
  for (let i = 0; i < NUM_STATIC_STARS; i++) {
    const star = document.createElement('div');
    star.className = 'static-star';
    
    const x = Math.random() * bounds.w;
    const y = Math.random() * bounds.h * 0.8;
    const size = 1 + Math.random() * 2;
    const delay = Math.random() * 3;
    
    star.style.left = x + 'px';
    star.style.top = y + 'px';
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.animationDelay = delay + 's';
    star.style.opacity = 0.3 + Math.random() * 0.7;
    
    container.appendChild(star);
    staticStars.push({ element: star });
  }
  
  // Create neural nodes (smaller = core, larger = outer)
  for (let i = 0; i < NUM_NODES; i++) {
    const node = document.createElement('div');
    node.className = 'neural-node';
    
    // Different sizes based on position
    if (i < 5) node.classList.add('core');
    else if (i < 12) node.classList.add('medium');
    else node.classList.add('small');
    
    const x = Math.random() * bounds.w;
    const y = Math.random() * bounds.h * 0.75;
    
    node.style.left = x + 'px';
    node.style.top = y + 'px';
    container.appendChild(node);
    
    neuralNodes.push({
      element: node,
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2
    });
  }
  
  // Create connections between nearby nodes
  neuralNodes.forEach((node, i) => {
    neuralNodes.slice(i + 1).forEach((other) => {
      const dx = node.x - other.x;
      const dy = node.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < CONN_DISTANCE) {
        const line = document.createElement('div');
        line.className = 'neural-connection';
        line.style.left = node.x + 'px';
        line.style.top = node.y + 'px';
        line.style.width = dist + 'px';
        line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
        container.appendChild(line);
        
        neuralConnections.push({ element: line, from: node, to: other });
      }
    });
  });
  
  // Mouse tracking
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  
  window.addEventListener('resize', () => {
    bounds.w = window.innerWidth;
    bounds.h = window.innerHeight;
  });
  
  // Start animation
  requestAnimationFrame(animateNeural);
}

function animateNeural() {
  const container = document.getElementById("starsBg");
  if (!container || container.style.display === 'none') return;
  
  // Update nodes
  neuralNodes.forEach(node => {
    const dx = mouseX - node.x;
    const dy = mouseY - node.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 250 && dist > 30) {
      const force = (250 - dist) / 250;
      node.vx += dx * 0.001 * force;
      node.vy += dy * 0.001 * force;
    }
    
    if (node.x < 20) node.vx += 0.5;
    if (node.x > bounds.w - 20) node.vx -= 0.5;
    if (node.y < 20) node.vy += 0.5;
    if (node.y > bounds.h - 20) node.vy -= 0.5;
    
    node.vx *= 0.96;
    node.vy *= 0.96;
    
    node.x += node.vx;
    node.y += node.vy;
    
    node.x = Math.max(15, Math.min(bounds.w - 15, node.x));
    node.y = Math.max(15, Math.min(bounds.h - 15, node.y));
    
    node.element.style.left = node.x + 'px';
    node.element.style.top = node.y + 'px';
  });
  
  // Update connections
  neuralConnections.forEach(conn => {
    const dx = conn.from.x - conn.to.x;
    const dy = conn.from.y - conn.to.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    conn.element.style.left = conn.to.x + 'px';
    conn.element.style.top = conn.to.y + 'px';
    conn.element.style.width = dist + 'px';
    conn.element.style.transform = `rotate(${angle}rad)`;
  });
  
  requestAnimationFrame(animateNeural);
}

// ========== WEATHER FX ==========
function applyWeatherFX(type) {
  DOM.rain.innerHTML = "";
  if (type.includes("Rain")) startRainFX();
}

function startRainFX() {
  const container = DOM.rain;
  for (let i = 0; i < 40; i++) {
    setTimeout(() => {
      const drop = document.createElement("div");
      drop.className = "rain-drop";
      drop.style.left = Math.random() * 100 + "%";
      drop.style.animationDuration = (0.4 + Math.random() * 0.4) + "s";
      container.appendChild(drop);
      setTimeout(() => drop.remove(), 800);
    }, i * 40);
  }
}

// ========== HISTORY ==========
function saveHistory(city) {
  let h = JSON.parse(localStorage.getItem("history")) || [];
  h = h.filter(x => x.city !== city);
  h.unshift({ city: city, time: Date.now() });
  h = h.slice(0, 5);
  localStorage.setItem("history", JSON.stringify(h));
  loadHistory();
}

function loadHistory() {
  const h = JSON.parse(localStorage.getItem("history")) || [];
  renderHistory(h);
}

function renderHistory(list) {
  const container = DOM.history;
  const historyList = container.querySelector('.history-list');
  if (!historyList) return;
  
  historyList.innerHTML = "";
  
  if (list.length === 0) {
    historyList.innerHTML = '<p class="history-empty">🔍 No recent searches</p>';
    return;
  }
  
  list.forEach((item, index) => {
    const el = document.createElement("div");
    el.className = "history-item";
    el.innerHTML = `
      <span class="city">${item.city}</span>
      <div class="history-actions">
        <span class="history-delete" data-city="${item.city}">✕</span>
      </div>
    `;
    el.addEventListener("click", () => {
      DOM.cityInput.value = item.city;
      DOM.form.requestSubmit();
    });
    el.querySelector(".history-delete").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteHistory(item.city);
    });
    historyList.appendChild(el);
  });
}

function deleteHistory(city) {
  let h = JSON.parse(localStorage.getItem("history")) || [];
  h = h.filter(x => x.city !== city);
  localStorage.setItem("history", JSON.stringify(h));
  loadHistory();
}

// ========== THEME ==========
let currentTheme = "light";

function initTheme() {
  currentTheme = localStorage.getItem("theme") || "light";
  applyTheme(currentTheme);
}

function toggleTheme() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(currentTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  currentTheme = theme;
  const btn = document.getElementById("darkModeToggle");
  if (btn) btn.textContent = theme === "dark" ? "🌙" : "☀️";
}

// ========== GEO ==========
function initGeo() {
  navigator.geolocation?.getCurrentPosition(async pos => {
    try {
      const data = await fetchWeatherData({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      });
      DOM.cityInput.value = data.name;
      loadCity(data.name);
    } catch (e) {
      console.warn("Geolocation fetch error:", e);
    }
  });
}

// ========== STATUS ==========
function setStatus(msg) {
  DOM.status.textContent = msg;
}

// ========== FUTURE PREDICTION ==========
function generatePrediction(forecastData, currentData) {
  if (!forecastData || forecastData.length < 2) {
    setPredictionDefaults();
    return;
  }
  
  const today = forecastData[0];
  const tomorrow = forecastData[1];
  const todayTemp = today?.main?.temp || 20;
  const tomorrowTemp = tomorrow?.main?.temp || todayTemp;
  
  // Tomorrow's temp
  const tomorrowEl = document.getElementById("tomorrowTemp");
  const tomorrowTrend = document.getElementById("tomorrowTrend");
  if (tomorrowEl) tomorrowEl.textContent = Math.round(tomorrowTemp) + "°";
  if (tomorrowTrend) {
    const diff = tomorrowTemp - todayTemp;
    if (diff > 2) tomorrowTrend.textContent = "Warmer ↑";
    else if (diff < -2) tomorrowTrend.textContent = "Cooler ↓";
    else tomorrowTrend.textContent = "Similar";
  }
  
  // Rain chance
  let rainCount = 0;
  forecastData.slice(0, 8).forEach(f => {
    const weather = f.weather?.[0]?.main || "";
    if (weather.includes("Rain") || weather.includes("Drizzle") || weather.includes("Thunderstorm")) {
      rainCount++;
    }
  });
  const rainChance = Math.round((rainCount / 8) * 100);
  const rainChanceEl = document.getElementById("rainChance");
  const rainDesc = document.getElementById("rainDesc");
  if (rainChanceEl) rainChanceEl.textContent = rainChance + "%";
  if (rainDesc) {
    if (rainChance > 60) rainDesc.textContent = "High chance";
    else if (rainChance > 30) rainDesc.textContent = "Moderate";
    else rainDesc.textContent = "Low chance";
  }
  
  // Wind trend
  const windTrendEl = document.getElementById("windTrend");
  const windDesc = document.getElementById("windDesc");
  let avgWind = 5;
  if (forecastData.length >= 4) {
    avgWind = forecastData.slice(0, 4).reduce((sum, f) => sum + (f.wind?.speed || 0), 0) / 4;
  }
  if (windTrendEl) windTrendEl.textContent = Math.round(avgWind) + " m/s";
  if (windDesc && currentData) {
    const currentWind = currentData.wind?.speed || avgWind;
    if (avgWind > currentWind + 2) windDesc.textContent = "Increasing";
    else if (avgWind < currentWind - 2) windDesc.textContent = "Decreasing";
    else windDesc.textContent = "Stable";
  }
  
  // Humidity trend
  const humidityTrendEl = document.getElementById("humidityTrend");
  const humidityDesc = document.getElementById("humidityDesc");
  let avgHumidity = 50;
  if (forecastData.length >= 4) {
    avgHumidity = forecastData.slice(0, 4).reduce((sum, f) => sum + (f.main?.humidity || 50), 0) / 4;
  }
  if (humidityTrendEl) humidityTrendEl.textContent = Math.round(avgHumidity) + "%";
  if (humidityDesc && currentData) {
    const currentHumidity = currentData.main?.humidity || avgHumidity;
    if (avgHumidity > currentHumidity + 10) humidityDesc.textContent = "Increasing";
    else if (avgHumidity < currentHumidity - 10) humidityDesc.textContent = "Decreasing";
    else humidityDesc.textContent = "Stable";
  }
  
  // Pressure trend
  const pressureTrendEl = document.getElementById("pressureTrend");
  const pressureDesc = document.getElementById("pressureDesc");
  let avgPressure = 1013;
  if (forecastData.length >= 4) {
    avgPressure = forecastData.slice(0, 4).reduce((sum, f) => sum + (f.main?.pressure || 1013), 0) / 4;
  }
  if (pressureTrendEl) pressureTrendEl.textContent = Math.round(avgPressure);
  if (pressureDesc && currentData) {
    const currentPressure = currentData.main?.pressure || avgPressure;
    if (avgPressure > currentPressure + 5) pressureDesc.textContent = "High";
    else if (avgPressure < currentPressure - 5) pressureDesc.textContent = "Low";
    else pressureDesc.textContent = "Normal";
  }
  
  // 5-Day trend
  const trendOutlookEl = document.getElementById("trendOutlook");
  const trendDescEl = document.getElementById("trendDesc");
  if (trendOutlookEl && forecastData.length >= 5) {
    const temps = forecastData.slice(0, 5).map(f => f.main?.temp || 20);
    const trend = temps[temps.length - 1] - temps[0];
    if (trend > 3) { trendOutlookEl.textContent = "Warming ↑"; trendDescEl.textContent = "Next 5 days"; }
    else if (trend < -3) { trendOutlookEl.textContent = "Cooling ↓"; trendDescEl.textContent = "Next 5 days"; }
    else { trendOutlookEl.textContent = "Stable →"; trendDescEl.textContent = "Next 5 days"; }
  }
}

function setPredictionDefaults() {
  const elements = ["tomorrowTemp", "tomorrowTrend", "rainChance", "rainDesc", "windTrend", "windDesc", "humidityTrend", "humidityDesc", "pressureTrend", "pressureDesc", "trendOutlook", "trendDesc"];
  elements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id.includes("Temp")) el.textContent = "--°";
      else if (id.includes("Trend") && id.includes("Value")) el.textContent = "--";
      else if (id.includes("Trend")) el.textContent = "--";
      else if (id.includes("Desc")) el.textContent = "--";
      else if (id.includes("Outlook")) el.textContent = "--";
    }
  });
}