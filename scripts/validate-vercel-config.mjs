import { readFileSync, existsSync } from "node:fs";

const configPath = new URL("../vercel.json", import.meta.url);
const config = JSON.parse(readFileSync(configPath, "utf8"));
const fail = (message) => {
  console.error(`Vercel config validation failed: ${message}`);
  process.exit(1);
};

if (config.version !== 2) fail("version must be 2");
if (!Array.isArray(config.builds) || !Array.isArray(config.routes)) fail("builds and routes must be arrays");
if (!config.builds.some((build) => build.use === "@vercel/static-build" && build.config?.distDir === "dist")) {
  fail("Vite static build must publish dist/");
}
if (!config.builds.some((build) => build.use === "@vercel/node" && build.src === "api/**/*.js")) {
  fail("Node serverless functions must include api/**/*.js");
}
for (const path of ["api/chat.js", "api/health.js"]) {
  if (!existsSync(new URL(`../${path}`, import.meta.url))) fail(`missing function: ${path}`);
}
const healthRoute = config.routes.findIndex((route) => route.src === "/health");
const filesystemRoute = config.routes.findIndex((route) => route.handle === "filesystem");
const fallbackRoute = config.routes.findIndex((route) => route.src === "/(.*)");
if (healthRoute < 0) fail("missing /health route");
if (filesystemRoute < 0 || fallbackRoute < 0 || filesystemRoute > fallbackRoute) {
  fail("filesystem handler must appear before the SPA fallback");
}
console.log("Vercel config OK: JSON, Vite output, API functions, and route ordering validated.");
