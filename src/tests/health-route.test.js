import { describe, expect, it } from "vitest";
import handler from "../../api/health.js";

function response() {
  return {
    headers: {},
    statusCode: 200,
    body: "",
    setHeader(name, value) { this.headers[name] = value; },
    end(body = "") { this.body = body; return this; },
  };
}

describe("API health endpoint", () => {
  it("returns a non-cacheable JSON health response", () => {
    const res = response();
    handler({ method: "GET" }, res);
    expect(res.statusCode).toBe(200);
    expect(res.headers["Cache-Control"]).toBe("no-store");
    expect(JSON.parse(res.body)).toMatchObject({ status: "ok", service: "x-bo" });
  });

  it("rejects unsupported methods", () => {
    const res = response();
    handler({ method: "POST" }, res);
    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe("GET, HEAD");
    expect(JSON.parse(res.body).error.code).toBe("METHOD_NOT_ALLOWED");
  });

  it("supports HEAD without a response body", () => {
    const res = response();
    handler({ method: "HEAD" }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("");
  });
});
