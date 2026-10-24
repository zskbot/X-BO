import { describe, expect, it } from "vitest";
import { readUrl } from "../../agent/tools.mjs";

describe("URL reader SSRF protection", () => {
  it("rejects localhost and private-network URLs", async () => {
    await expect(readUrl("http://127.0.0.1/")).rejects.toThrow();
    await expect(readUrl("http://localhost/")).rejects.toThrow();
    await expect(readUrl("file:///etc/passwd")).rejects.toThrow();
  });

  it("rejects URL credentials and non-standard ports", async () => {
    await expect(readUrl("https://user:pass@example.com/")).rejects.toThrow();
    await expect(readUrl("http://example.com:3000/")).rejects.toThrow();
  });
});
