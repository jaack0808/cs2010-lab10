import type { RenderResult, WeatherSnapshot } from "./types";

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function fetchWeather(): Promise<WeatherSnapshot> {
  const res = await fetch("/api/weather");
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as WeatherSnapshot;
}

export async function renderImage(): Promise<RenderResult> {
  const res = await fetch("/api/render", { method: "POST" });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as RenderResult;
}
