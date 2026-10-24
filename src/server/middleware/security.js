import { randomUUID } from "node:crypto";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

export function requestIdMiddleware(req, res, next) {
  const supplied = req.get("x-request-id");
  const requestId = supplied && REQUEST_ID_PATTERN.test(supplied) ? supplied : randomUUID();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}

export function createRateLimitMiddleware({
  windowMs = 60_000,
  max = 30,
  maxKeys = 5_000,
  now = Date.now,
} = {}) {
  const buckets = new Map();

  return function rateLimit(req, res, next) {
    const current = now();
    const forwarded = req.get?.("x-forwarded-for");
    // Use the left-most proxy value only when the app is deployed behind a trusted proxy.
    // Prefer Express's req.ip when trust proxy is configured by the hosting platform.
    const key = String(req.ip || req.socket?.remoteAddress || forwarded?.split(",")[0] || "unknown");
    let bucket = buckets.get(key);

    if (!bucket || current - bucket.startedAt >= windowMs) {
      bucket = { startedAt: current, count: 0 };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    if (buckets.size > maxKeys) {
      for (const [candidate, value] of buckets) {
        if (current - value.startedAt >= windowMs) buckets.delete(candidate);
      }
      while (buckets.size > maxKeys) buckets.delete(buckets.keys().next().value);
    }

    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    if (bucket.count > max) {
      const retrySeconds = Math.max(1, Math.ceil((bucket.startedAt + windowMs - current) / 1000));
      res.setHeader("Retry-After", String(retrySeconds));
      return res.status(429).json({
        error: { code: "RATE_LIMITED", message: "Too many requests. Try again later." },
        requestId: req.requestId,
      });
    }
    next();
  };
}

export function corsOptionsFromEnv(env = process.env) {
  const configured = String(env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowed = new Set(configured.length ? configured : env.NODE_ENV === "production"
    ? []
    : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173"]);

  return {
    credentials: false,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Request-Id"],
    maxAge: 600,
    origin(origin, callback) {
      // Non-browser clients and same-origin requests do not send Origin.
      if (!origin || allowed.has(origin)) return callback(null, true);
      return callback(null, false);
    },
  };
}
