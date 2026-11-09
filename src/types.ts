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

export interface GeneratedImage {
  dataUrl: string;
  mediaType: string;
}

export interface RenderResult {
  weather: WeatherSnapshot;
  prompt: string;
  model: string;
  images: GeneratedImage[];
}
