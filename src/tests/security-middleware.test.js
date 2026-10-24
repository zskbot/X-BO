import { describe, expect, it, vi } from "vitest";
import { corsOptionsFromEnv, createRateLimitMiddleware, requestIdMiddleware } from "../server/middleware/security.js";

function response() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

describe("server security middleware", () => {
  it("accepts a valid request ID and replaces an invalid one", () => {
    const next = vi.fn();
    const res = response();
    requestIdMiddleware({ get: () => "req-123" }, res, next);
    expect(res.headers["X-Request-Id"]).toBe("req-123");
    expect(next).toHaveBeenCalledOnce();

    const invalidRes = response();
    requestIdMiddleware({ get: () => "bad\r\nid" }, invalidRes, next);
    expect(invalidRes.headers["X-Request-Id"]).not.toContain("\n");
  });

  it("blocks requests after the configured rate limit and emits Retry-After", () => {
    let clock = 1_000;
    const limiter = createRateLimitMiddleware({ windowMs: 60_000, max: 2, now: () => clock });
    const req = { ip: "203.0.113.10", requestId: "req-test", get: () => undefined };
    const first = response();
    const second = response();
    const third = response();
    const next = vi.fn();

    limiter(req, first, next);
    limiter(req, second, next);
    limiter(req, third, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(third.statusCode).toBe(429);
    expect(third.headers["Retry-After"]).toBe("60");
    expect(third.body.error.code).toBe("RATE_LIMITED");

    clock += 60_001;
    const afterWindow = response();
    limiter(req, afterWindow, next);
    expect(afterWindow.statusCode).toBe(200);
    expect(next).toHaveBeenCalledTimes(3);
  });

  it("does not allow arbitrary production origins by default", () => {
    const options = corsOptionsFromEnv({ NODE_ENV: "production" });
    const callback = vi.fn();
    options.origin("https://evil.example", callback);
    expect(callback).toHaveBeenCalledWith(null, false);
  });

  it("supports a comma-separated origin allow-list", () => {
    const options = corsOptionsFromEnv({ NODE_ENV: "production", ALLOWED_ORIGIN: "https://app.example, https://admin.example" });
    const callback = vi.fn();
    options.origin("https://app.example", callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });
});
