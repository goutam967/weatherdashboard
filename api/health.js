// Vercel Serverless Function: /api/health
module.exports = function handler(req, res) {
  res.status(200).json({
    status: "ok",
    service: "SkyCast Weather Dashboard API",
    platform: "Vercel Serverless",
    timestamp: new Date().toISOString()
  });
};
