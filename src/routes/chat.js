import { Router } from "express";
import { timingSafeEqual } from "node:crypto";
import { router as ai } from "../router/index.js";
import { db } from "../db/database.js";

const r = Router();
const MAX_PROMPT_CHARS = 8_000;
const MAX_PROVIDER_CHARS = 64;

const insert = db.prepare(`
INSERT INTO chats(provider,prompt,response)
VALUES(?,?,?)
`);

const history = db.prepare(`
SELECT *
FROM chats
ORDER BY id DESC
LIMIT 100
`);

function authorizedForHistory(req) {
  const expected = process.env.CHAT_HISTORY_ADMIN_TOKEN;
  const supplied = req.get("x-admin-token");
  if (!expected || !supplied || expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

r.post("/", async (req, res) => {
  const prompt = req.body?.message;
  const requestedProvider = req.body?.model;
  const provider = typeof requestedProvider === "string" && requestedProvider.trim()
    ? requestedProvider.trim()
    : process.env.DEFAULT_MODEL;

  if (typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({
      error: { code: "INVALID_PROMPT", message: "A non-empty message is required." },
      requestId: req.requestId,
    });
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return res.status(413).json({
      error: { code: "PROMPT_TOO_LARGE", message: `Message must be ${MAX_PROMPT_CHARS} characters or fewer.` },
      requestId: req.requestId,
    });
  }
  if (provider !== undefined && provider !== null &&
      (typeof provider !== "string" || provider.length > MAX_PROVIDER_CHARS ||
       !/^[a-z0-9._:-]+$/i.test(provider))) {
    return res.status(400).json({
      error: { code: "INVALID_PROVIDER", message: "The requested model identifier is invalid." },
      requestId: req.requestId,
    });
  }

  try {
    const response = await ai(prompt.trim(), provider);
    insert.run(provider || "default", prompt.trim(), response);
    return res.json({ success: true, response, requestId: req.requestId });
  } catch (error) {
    // Do not return provider response bodies, credentials, or stack traces to clients.
    console.error("Chat request failed", {
      requestId: req.requestId,
      errorName: error?.name || "Error",
    });
    return res.status(502).json({
      error: { code: "AI_PROVIDER_FAILED", message: "The AI provider could not complete this request." },
      requestId: req.requestId,
    });
  }
});

r.get("/history", (req, res) => {
  // Conversation history is private by default. Enabling it requires an out-of-band admin token.
  if (!authorizedForHistory(req)) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Not found." } });
  }
  return res.json(history.all());
});

export default r;
