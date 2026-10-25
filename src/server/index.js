import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { router } from "../router/index.js";
import { health } from "../health/index.js";
import chatRoutes from "../routes/chat.js";
import { createSocket } from "../ws/server.js";
import { corsOptionsFromEnv, createRateLimitMiddleware, requestIdMiddleware } from "./middleware/security.js";
import { openApiSpec } from "./openapi.js";
import { validateLegacyChatRequest } from "./chat-validation.js";

const app=express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(requestIdMiddleware);
app.use(cors(corsOptionsFromEnv()));
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(express.json({ limit: "128kb" }));
const chatRateLimit = createRateLimitMiddleware({ windowMs: 60_000, max: 30 });
app.use("/v1/chat", chatRateLimit, chatRoutes);

app.get("/openapi.json", (req, res) => res.status(200).json(openApiSpec));

app.get("/livez", (req, res) => res.status(200).json({ status: "ok", uptimeSeconds: Math.floor(process.uptime()), requestId: req.requestId }));

app.get("/readyz", (req, res) => res.status(200).json({ status: "ready", requestId: req.requestId }));

app.get("/health",(req,res)=>{
  res.json(health());
});

app.post("/chat", chatRateLimit, async (req, res, next) => {
  const validated = validateLegacyChatRequest(req.body);
  if (validated.error) {
    return res.status(validated.error.status).json({
      error: { code: validated.error.code, message: validated.error.message },
      requestId: req.requestId,
    });
  }

  try {
    const result = await router(validated.message, validated.model);
    return res.json({ result });
  } catch (error) {
    return next(error);
  }
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err?.type === "entity.too.large" ? 413 : err?.message === "Origin not allowed" ? 403 : 500;
  const code = status === 413 ? "PAYLOAD_TOO_LARGE" : status === 403 ? "ORIGIN_NOT_ALLOWED" : "INTERNAL_ERROR";
  if (status === 500) console.error("Request failed", { requestId: req.requestId, message: err?.message });
  res.status(status).json({ error: { code, message: status === 500 ? "Internal server error." : status === 413 ? "Request body is too large." : "Origin is not allowed." }, requestId: req.requestId });
});

const port=process.env.PORT||3000;

const server=createServer(app);
createSocket(server);

server.listen(port,()=>{
  console.log("API running on",port);
});
