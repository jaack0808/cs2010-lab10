# Weather Art — Express + Vite/React app

Part 2 of Lab 10. A small web app that:

1. **Pulls the current weather** for Plymouth, NH (`43.7589, -71.6892`) from the
   National Weather Service API.
2. **Repaints a reference image** to match the **time of day**, **time of year**,
   and **forecasted weather**, using an OpenRouter text+image-to-image model.

## How it works

- `server/weather.ts` — calls `api.weather.gov` (`/points/{lat},{lon}` →
  `forecast/hourly`), and derives the time of day (`dawn`/`day`/`dusk`/`night`)
  and season from the location's local clock.
- `server/prompt.ts` — turns the weather snapshot into a deterministic
  text-to-image instruction (no extra model call).
- `server/image.ts` — sends the reference image (as a base64 `data:` URL) plus
  the prompt to `https://openrouter.ai/api/v1/images`.
- `server/index.ts` — Express API: `GET /api/weather`, `POST /api/render`.
- `src/` — React UI (Vite) showing the weather card, a **Generate image**
  button, and a before/after comparison.

## Running it

```bash
# 1. Provide your OpenRouter key (gitignored).
#    Either reuse ./openrouter.env or create .env:
echo 'OPENROUTER_API_KEY=sk-or-v1-...' > .env

# 2. Install deps.
npm install

# 3a. Development: Express on :3001 + Vite on :5173 (proxying /api).
npm run dev
#     open http://localhost:5173

# 3b. Production: build the client, then serve everything from Express.
npm run build
npm start
#     open http://localhost:3001
```

## Configuration (optional env vars)

| Variable              | Default                     | Purpose                          |
| --------------------- | --------------------------- | -------------------------------- |
| `OPENROUTER_API_KEY`  | —                           | Required. OpenRouter key.        |
| `IMAGE_MODEL`         | `qwen/qwen-image-2.1-turbo` | Image model used for the repaint.|
| `WEATHER_LAT` / `WEATHER_LON` | `43.7589` / `-71.6892` | Location to pull weather for.    |
| `WEATHER_USER_AGENT`  | app default                 | weather.gov requires a contact.  |
| `REFERENCE_IMAGE`     | `public/reference.png`      | Image that gets repainted.       |

`public/reference.png` is a copy of `output/christmas.png` from Part 1.

> Generating one image takes ~20 seconds and costs OpenRouter credit, so it only
> runs when you click **Generate image**.
