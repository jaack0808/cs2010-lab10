import { useEffect, useState } from "react";

import { fetchWeather, renderImage } from "./api";
import type { RenderResult, WeatherSnapshot } from "./types";

const SEASON_LABEL: Record<string, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
};

const TIME_LABEL: Record<string, string> = {
  dawn: "Dawn",
  day: "Daytime",
  dusk: "Dusk",
  night: "Night",
};

export default function App() {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const [result, setResult] = useState<RenderResult | null>(null);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeather()
      .then(setWeather)
      .catch((e: Error) => setWeatherError(e.message));
  }, []);

  async function onGenerate() {
    setRendering(true);
    setRenderError(null);
    try {
      setResult(await renderImage());
    } catch (e) {
      setRenderError((e as Error).message);
    } finally {
      setRendering(false);
    }
  }

  return (
    <main className="page">
      <header>
        <h1>Weather Art</h1>
        <p className="subtitle">
          Pulls the current weather and repaints a reference image to match the
          time of day, time of year, and forecast.
        </p>
      </header>

      <section className="card">
        <h2>
          {weather
            ? `${weather.location.city}, ${weather.location.state}`
            : "Current weather"}
        </h2>

        {weatherError && <p className="error">Could not load weather: {weatherError}</p>}
        {!weather && !weatherError && <p className="muted">Loading weather…</p>}

        {weather && (
          <>
            <div className="temp">
              {weather.current.temperature}°{weather.current.unit}
            </div>
            <dl className="grid">
              <div>
                <dt>Conditions</dt>
                <dd>{weather.current.shortForecast}</dd>
              </div>
              <div>
                <dt>Wind</dt>
                <dd>
                  {weather.current.windSpeed} {weather.current.windDirection}
                </dd>
              </div>
              <div>
                <dt>Precipitation</dt>
                <dd>
                  {weather.current.precipitationChance == null
                    ? "—"
                    : `${weather.current.precipitationChance}%`}
                </dd>
              </div>
              <div>
                <dt>Time of day</dt>
                <dd>{TIME_LABEL[weather.timeOfDay]}</dd>
              </div>
              <div>
                <dt>Season</dt>
                <dd>{SEASON_LABEL[weather.season]}</dd>
              </div>
              <div>
                <dt>Local time</dt>
                <dd>{weather.localTime}</dd>
              </div>
            </dl>
          </>
        )}

        <button onClick={onGenerate} disabled={rendering || !weather}>
          {rendering ? "Generating… (~20s)" : "Generate image"}
        </button>
        {renderError && <p className="error">Generation failed: {renderError}</p>}
      </section>

      <section className="images">
        <figure>
          <figcaption>Reference</figcaption>
          <img src="/reference.png" alt="Reference" />
        </figure>
        {result?.images.map((img, i) => (
          <figure key={i}>
            <figcaption>Repainted</figcaption>
            <img src={img.dataUrl} alt="Generated" />
          </figure>
        ))}
      </section>

      {result && (
        <section className="card">
          <h3>Prompt sent to {result.model}</h3>
          <p className="prompt">{result.prompt}</p>
        </section>
      )}
    </main>
  );
}
