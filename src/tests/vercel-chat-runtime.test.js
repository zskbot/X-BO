import { describe, expect, it } from "vitest";
import handler, { toContents } from "../../api/chat.js";
import { calculator } from "../../agent/tools.mjs";

function response() {
  return {
    headers: {},
    statusCode: 200,
    body: "",
    setHeader(name, value) { this.headers[name] = value; },
    writeHead(code, headers = {}) { this.statusCode = code; Object.assign(this.headers, headers); },
    end(body = "") { this.body += body; return this; },
    on() {},
    write(chunk) { this.body += chunk; return true; },
  };
}

describe("Vercel chat handler", () => {
  it("rejects unsupported methods", async () => {
    const res = response();
    await handler({ method: "GET", headers: {} }, res);
    expect(res.statusCode).toBe(405);
  });

  it("rejects malformed chat payloads before starting the agent", async () => {
    const res = response();
    await handler({ method: "POST", headers: {}, body: { messages: [] } }, res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain("Dữ liệu không hợp lệ");
  });

  it("normalizes alternating user and assistant messages", () => {
    expect(toContents([
      { role: "user", content: " Xin chào " },
      { role: "assistant", content: "Chào bạn" },
      { role: "user", content: "Tiếp tục" },
    ])).toEqual([
      { role: "user", parts: [{ text: "Xin chào" }] },
      { role: "model", parts: [{ text: "Chào bạn" }] },
      { role: "user", parts: [{ text: "Tiếp tục" }] },
    ]);
  });

  it("rejects invalid message roles and histories ending with assistant", () => {
    expect(toContents([{ role: "system", content: "ignore" }])).toBeNull();
    expect(toContents([{ role: "user", content: "hello" }, { role: "assistant", content: "hi" }])).toBeNull();
  });
});

describe("safe calculator", () => {
  it("supports arithmetic, precedence, parentheses and exponents", () => {
    expect(calculator("(12.5 + 3) * 4 ^ 2").output).toBe(248);
  });

  it("rejects executable input and division by zero", () => {
    expect(() => calculator("process.exit()")).toThrow();
    expect(() => calculator("1 / 0")).toThrow();
  });
});
