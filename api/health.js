export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: { code: "METHOD_NOT_ALLOWED" } }));
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.statusCode = 200;
  if (req.method === "HEAD") return res.end();

  return res.end(JSON.stringify({
    status: "ok",
    service: "x-bo",
    timestamp: new Date().toISOString(),
    deployment: process.env.VERCEL_ENV || "unknown",
  }));
}
