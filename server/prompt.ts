// Builds the text-to-image instruction from the current weather snapshot.
//
// The prompt is deterministic (no extra model call): it turns the time of day,
// season, and forecast into a sentence that tells the image model to repaint
// the reference image while keeping its composition intact.

import type { Season, TimeOfDay, WeatherSnapshot } from "./weather";

const TIME_OF_DAY: Record<TimeOfDay, string> = {
  dawn: "early morning around dawn",
  day: "bright daytime",
  dusk: "golden hour around dusk",
  night: "nighttime under a moonlit sky",
};

const SEASON_ADJ: Record<Season, string> = {
  spring: "fresh, verdant spring",
  summer: "warm, lush summer",
  autumn: "crisp, colorful autumn",
  winter: "cold, snowy winter",
};

function describeWeather(shortForecast: string, temp: number, precip: number | null): string {
  const s = shortForecast.toLowerCase();
  let sky: string | null = null;

  if (s.includes("thunder")) sky = "a dramatic, stormy sky with thunderclouds";
  else if (s.includes("snow")) sky = "falling snow";
  else if (s.includes("rain") || s.includes("shower") || s.includes("drizzle"))
    sky = "rain and wet, moody air";
  else if (s.includes("fog")) sky = "thick fog";
  else if (s.includes("partly")) sky = "a partly cloudy sky";
  else if (s.includes("cloud") || s.includes("overcast")) sky = "overcast clouds";
  else if (s.includes("clear") || s.includes("sunny")) sky = "a clear sky";

  const bits: string[] = [];
  if (sky) bits.push(sky);
  if (
    precip != null &&
    precip >= 40 &&
    !/rain|snow|thunder/.test(s)
  ) {
    bits.push(`a ${precip}% chance of precipitation`);
  }
  bits.push(`about ${temp}°F`);

  return bits.join(", ");
}

export function buildPrompt(weather: WeatherSnapshot): string {
  const { location, current, timeOfDay, season } = weather;
  const conditions = describeWeather(
    current.shortForecast,
    current.temperature,
    current.precipitationChance,
  );

  return [
    `Repaint the reference image to match the weather right now in ${location.city}, ${location.state}.`,
    `It is ${TIME_OF_DAY[timeOfDay]} on a ${SEASON_ADJ[season]} day.`,
    `Current conditions: ${current.shortForecast} (${conditions}).`,
    `Adjust the lighting, sky, and atmosphere to match, but keep the composition, subject, and framing of the original image unchanged.`,
  ].join(" ");
}
