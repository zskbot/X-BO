import { router } from "../src/router/index.js";
import { runXBO } from "../src/agent/runtime.js";

const MAX_MESSAGE_CHARS = 12_000;

function sendSSE(res, type, payload) {
  res.write(`event: ${type}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body)
    ? req.body
    : {};
  const prompt = typeof body.message === "string"
    ? body.message
    : typeof body.prompt === "string" ? body.prompt : "";

  if (!prompt.trim()) {
    return res.status(400).json({ success: false, error: "Missing prompt/message" });
  }
  if (prompt.length > MAX_MESSAGE_CHARS) {
    return res.status(413).json({ success: false, error: `Message exceeds ${MAX_MESSAGE_CHARS} characters` });
  }

  const requestedModel = typeof body.model === "string" ? body.model.trim() : "";
  const configuredDefault = process.env.DEFAULT_MODEL || "gemini";
  const provider = requestedModel.startsWith("gemini-")
    ? "gemini"
    : requestedModel || configuredDefault;
  const wantsStream = body.stream === true || req.headers?.accept?.includes("text/event-stream");

  try {
    if (provider === "gemini" || provider.startsWith("gemini-")) {
      if (!wantsStream) {
        const result = await runXBO({ message: prompt, history: body.history });
        return res.status(200).json({ success: true, response: result.text, model: result.model });
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders?.();

      const result = await runXBO({
        message: prompt,
        history: body.history,
        onDelta: async (text) => sendSSE(res, "delta", { text })
      });
      sendSSE(res, "done", { model: result.model });
      return res.end();
    }

    // Preserve existing provider integrations for non-Gemini model aliases.
    const response = await router(prompt, provider);
    return res.status(200).json({ success: true, response, model: provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown agent error";
    console.error("[X-BO chat]", message);

    if (wantsStream && res.headersSent) {
      sendSSE(res, "error", { error: message });
      return res.end();
    }

    const status = error instanceof RangeError || error instanceof TypeError ? 400 : 500;
    return res.status(status).json({ success: false, error: message });
  }
}
