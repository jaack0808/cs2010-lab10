// Calls the OpenRouter image API for a text+image-to-image ("ti2i") repaint.
//
// Sends the reference image as a base64 data: URL alongside the prompt and
// returns the generated image(s) as data: URLs for the browser.
//
// Docs: https://openrouter.ai/docs (Images endpoint)

import { readFile } from "node:fs/promises";
import { extname } from "node:path";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export interface GeneratedImage {
  dataUrl: string;
  mediaType: string;
}

export interface GenerateResult {
  model: string;
  images: GeneratedImage[];
}

export async function generateImage(refPath: string, prompt: string): Promise<GenerateResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set (add it to openrouter.env)");
  }

  const mime = MIME_BY_EXT[extname(refPath).toLowerCase()] ?? "image/png";
  const refBytes = await readFile(refPath);
  const refUrl = `data:${mime};base64,${refBytes.toString("base64")}`;
  const model = process.env.IMAGE_MODEL ?? "qwen/qwen-image-2.1-turbo";

  const response = await fetch("https://openrouter.ai/api/v1/images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      input_references: [{ type: "image_url", image_url: { url: refUrl } }],
    }),
  });

  const body = (await response.json().catch(() => ({}))) as {
    data?: Array<{ b64_json?: string; media_type?: string }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    const msg = body?.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`OpenRouter image request failed: ${msg}`);
  }

  const images: GeneratedImage[] = (body.data ?? [])
    .filter((d) => typeof d.b64_json === "string")
    .map((d) => {
      const mediaType = d.media_type ?? "image/png";
      return {
        mediaType,
        dataUrl: `data:${mediaType};base64,${d.b64_json}`,
      };
    });

  if (images.length === 0) {
    throw new Error("OpenRouter returned no images");
  }

  return { model, images };
}
