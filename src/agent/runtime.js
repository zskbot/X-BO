import { GoogleGenAI } from "@google/genai";
import { XBO_SYSTEM_PROMPT } from "./system-prompt.js";

const MAX_MESSAGE_CHARS = 12_000;
const MAX_HISTORY_MESSAGES = 16;
const MAX_HISTORY_CHARS = 24_000;

function getClient() {
  const apiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing LLM_API_KEY (or GEMINI_API_KEY) environment variable.");
  }
  return new GoogleGenAI({ apiKey });
}

function normalizeHistory(history, message) {
  if (!Array.isArray(history)) return [{ role: "user", parts: [{ text: message }] }];

  const safeHistory = history
    .filter((item) => item && ["user", "assistant", "model"].includes(item.role))
    .map((item) => ({
      role: item.role === "assistant" ? "model" : item.role,
      text: typeof item.content === "string" ? item.content : typeof item.text === "string" ? item.text : ""
    }))
    .filter((item) => item.text.trim())
    .slice(-MAX_HISTORY_MESSAGES);

  let total = 0;
  const bounded = [];
  for (const item of safeHistory.reverse()) {
    const remaining = MAX_HISTORY_CHARS - total;
    if (remaining <= 0) break;
    const text = item.text.slice(0, remaining);
    bounded.unshift({ role: item.role, parts: [{ text }] });
    total += text.length;
  }
  bounded.push({ role: "user", parts: [{ text: message }] });
  return bounded;
}

export async function runXBO({ message, history = [], onDelta } = {}) {
  if (typeof message !== "string" || !message.trim()) {
    throw new TypeError("message must be a non-empty string");
  }
  const prompt = message.trim();
  if (prompt.length > MAX_MESSAGE_CHARS) {
    throw new RangeError(`message exceeds ${MAX_MESSAGE_CHARS} characters`);
  }

  const ai = getClient();
  const model = process.env.DEFAULT_MODEL && process.env.DEFAULT_MODEL !== "zsk"
    ? process.env.DEFAULT_MODEL
    : "gemini-2.5-flash";
  const contents = normalizeHistory(history, prompt);
  const stream = await ai.models.generateContentStream({
    model,
    contents,
    config: {
      systemInstruction: XBO_SYSTEM_PROMPT,
      temperature: 0.7,
      maxOutputTokens: 4096
    }
  });

  let text = "";
  for await (const chunk of stream) {
    const delta = typeof chunk.text === "string" ? chunk.text : "";
    if (!delta) continue;
    text += delta;
    if (typeof onDelta === "function") await onDelta(delta);
  }
  return { text, model };
}
