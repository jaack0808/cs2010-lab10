// Express API server.
//
//   GET  /api/weather  -> current weather snapshot for the configured location
//   POST /api/render   -> repaint the reference image to match the weather
//
// In development the Vite dev server (npm run dev:client) serves the React app
// and proxies /api here. In production (npm run start) this also serves dist/.

import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import dotenv from "dotenv";

import { getWeather } from "./weather.js";
import { buildPrompt } from "./prompt.js";
import { generateImage } from "./image.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

// openrouter.env holds the key (and is gitignored); .env can override/add.
dotenv.config({ path: path.join(root, "openrouter.env") });
dotenv.config({ path: path.join(root, ".env") });

const app = express();
app.use(express.json({ limit: "30mb" }));

const PORT = Number(process.env.PORT ?? 3001);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    hasKey: Boolean(process.env.OPENROUTER_API_KEY),
    imageModel: process.env.IMAGE_MODEL ?? "qwen/qwen-image-2.1-turbo",
  });
});

app.get("/api/weather", async (_req, res) => {
  try {
    res.json(await getWeather());
  } catch (err) {
    console.error("[weather]", err);
    res.status(502).json({ error: (err as Error).message });
  }
});

app.post("/api/render", async (_req, res) => {
  try {
    const weather = await getWeather();
    const prompt = buildPrompt(weather);
    const refPath = path.resolve(root, process.env.REFERENCE_IMAGE ?? "public/reference.png");
    const result = await generateImage(refPath, prompt);
    res.json({ weather, prompt, model: result.model, images: result.images });
  } catch (err) {
    console.error("[render]", err);
    res.status(502).json({ error: (err as Error).message });
  }
});

// Serve the built front end in production.
if (process.env.NODE_ENV === "production") {
  const dist = path.join(root, "dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
