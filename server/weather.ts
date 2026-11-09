// Pulls the current weather for a location from the National Weather Service.
//
// NWS flow (https://www.weather.gov/documentation/services-web-api):
//   1. GET /points/{lat},{lon}   -> metadata + links (forecastHourly, timeZone,
//                                   relative location).
//   2. GET forecastHourly        -> periods[]; periods[0] is "right now".
//
// weather.gov requires a descriptive User-Agent. Note the API returns times in
// the location's own time zone, which we also use to derive time-of-day/season.

const NWS = "https://api.weather.gov";

export type TimeOfDay = "dawn" | "day" | "dusk" | "night";
export type Season = "spring" | "summer" | "autumn" | "winter";

export interface WeatherSnapshot {
  location: {
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    timeZone: string;
  };
  observedAt: string;
  localTime: string;
  current: {
    temperature: number;
    unit: string;
    shortForecast: string;
    windSpeed: string;
    windDirection: string;
    precipitationChance: number | null;
    isDaytime: boolean;
  };
  timeOfDay: TimeOfDay;
  season: Season;
}

interface PointsResponse {
  properties: {
    forecastHourly: string;
    timeZone: string;
    relativeLocation: {
      properties: { city: string; state: string };
    };
  };
}

interface HourlyResponse {
  properties: {
    periods: Array<{
      startTime: string;
      temperature: number;
      temperatureUnit: string;
      shortForecast: string;
      windSpeed: string;
      windDirection: string;
      isDaytime: boolean;
      probabilityOfPrecipitation?: { value: number | null } | null;
    }>;
  };
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function userAgent(): string {
  return (
    process.env.WEATHER_USER_AGENT ??
    "cs2010-lab10-weather-app (https://github.com/jaack0808)"
  );
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": userAgent(),
      Accept: "application/geo+json",
    },
  });
  if (!res.ok) {
    throw new Error(`weather.gov request failed: ${res.status} ${res.statusText} (${url})`);
  }
  return (await res.json()) as T;
}

// Extract the wall-clock hour and month at the location, in its own time zone.
function localParts(
  timeZone: string,
  date = new Date(),
): { hour: number; month: number; text: string } {
  try {
    // dateStyle/timeStyle can't be combined with hour/month fields, so use two
    // formatters: one for machine-readable fields, one for the display string.
    const fieldFmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      hour12: false,
      month: "numeric",
    });
    const parts = fieldFmt.formatToParts(date);
    const pick = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");

    const displayFmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      dateStyle: "medium",
      timeStyle: "short",
    });

    return {
      hour: pick("hour") % 24,
      month: pick("month"),
      text: displayFmt.format(date),
    };
  } catch {
    // If the time zone is unknown to this Node build, fall back to UTC.
    return {
      hour: date.getUTCHours(),
      month: date.getUTCMonth() + 1,
      text: date.toISOString(),
    };
  }
}

function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}

function season(month: number): Season {
  if (month === 12 || month <= 2) return "winter";
  if (month <= 5) return "spring";
  if (month <= 8) return "summer";
  return "autumn";
}

export async function getWeather(): Promise<WeatherSnapshot> {
  const lat = envNumber("WEATHER_LAT", 43.7589);
  const lon = envNumber("WEATHER_LON", -71.6892);

  const points = await getJson<PointsResponse>(`${NWS}/points/${lat},${lon}`);
  const { forecastHourly, timeZone } = points.properties;
  const rel = points.properties.relativeLocation.properties;

  const hourly = await getJson<HourlyResponse>(forecastHourly);
  const period = hourly.properties.periods[0];
  if (!period) throw new Error("weather.gov returned no hourly forecast periods");

  const parts = localParts(timeZone);

  return {
    location: {
      city: rel.city,
      state: rel.state,
      latitude: lat,
      longitude: lon,
      timeZone,
    },
    observedAt: period.startTime,
    localTime: parts.text,
    current: {
      temperature: period.temperature,
      unit: period.temperatureUnit,
      shortForecast: period.shortForecast,
      windSpeed: period.windSpeed,
      windDirection: period.windDirection,
      precipitationChance: period.probabilityOfPrecipitation?.value ?? null,
      isDaytime: period.isDaytime,
    },
    timeOfDay: timeOfDay(parts.hour),
    season: season(parts.month),
  };
}
