import { describe, expect, it } from "vitest";
import { readUrl } from "../../agent/tools.mjs";

describe("URL reader SSRF protection", () => {
  it("rejects localhost and private-network URLs", async () => {
    await expect(readUrl("http://127.0.0.1/")).rejects.toThrow();
    await expect(readUrl("http://localhost/")).rejects.toThrow();
    await expect(readUrl("http://10.0.0.1/")).rejects.toThrow();
    await expect(readUrl("http://169.254.169.254/latest/meta-data/")).rejects.toThrow();
    await expect(readUrl("http://192.0.2.1/")).rejects.toThrow();
    await expect(readUrl("http://198.18.0.1/")).rejects.toThrow();
    await expect(readUrl("http://224.0.0.1/")).rejects.toThrow();
    await expect(readUrl("http://[::1]/")).rejects.toThrow();
    await expect(readUrl("http://[fd00::1]/")).rejects.toThrow();
    await expect(readUrl("file:///etc/passwd")).rejects.toThrow();
  });

  it("rejects URL credentials and non-standard ports", async () => {
    await expect(readUrl("https://user:pass@example.com/")).rejects.toThrow();
    await expect(readUrl("http://example.com:3000/")).rejects.toThrow();
  });

  it("rejects malformed URLs", async () => {
    await expect(readUrl("not-a-url")).rejects.toThrow();
    await expect(readUrl("")).rejects.toThrow();
  });
});
