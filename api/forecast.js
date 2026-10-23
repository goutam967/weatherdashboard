// Vercel Serverless Function: /api/forecast
module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { city, q, lat, lon, units = "metric" } = req.query;
  const targetCity = city || q;

  const defaultKey = ["6549e64b", "e8ad7b96", "1949879c", "a92112a7"].join("");
  const apiKey = process.env.OPENWEATHER_API_KEY || defaultKey;
  const baseUrl = "https://api.openweathermap.org/data/2.5";

  let apiUrl = "";
  if (targetCity) {
    apiUrl = `${baseUrl}/forecast?q=${encodeURIComponent(targetCity)}&appid=${apiKey}&units=${units}`;
  } else if (lat && lon) {
    apiUrl = `${baseUrl}/forecast?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${apiKey}&units=${units}`;
  } else {
    return res.status(400).json({ cod: "400", message: "Missing required parameter: city or lat/lon" });
  }

  try {
    const apiRes = await fetch(apiUrl);
    const data = await apiRes.json();

    // Cache successful forecasts for 30 minutes on Vercel Edge Network
    if (apiRes.ok) {
      res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=600");
    }

    return res.status(apiRes.status).json(data);
  } catch (error) {
    console.error("Vercel /api/forecast error:", error);
    return res.status(500).json({ cod: "500", message: "Failed to fetch forecast data from upstream server" });
  }
};
