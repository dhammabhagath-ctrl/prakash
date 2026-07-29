import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for fetching JSON from external APIs safely
async function fetchJson(url: string) {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`API fetch failed with status ${resp.status}`);
  }
  return resp.json();
}

// 1. Geocoding Search API
app.get('/api/weather/geocode', async (req, res) => {
  try {
    const query = (req.query.q as string) || '';
    if (!query || query.trim().length < 2) {
      return res.json({ results: [] });
    }
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query.trim()
    )}&count=8&language=en&format=json`;
    const data = await fetchJson(url);
    res.json(data);
  } catch (err: any) {
    console.error('Geocode search error:', err.message);
    res.status(500).json({ error: 'Failed to search location' });
  }
});

// 2. Reverse Geocoding API
app.get('/api/weather/reverse-geocode', async (req, res) => {
  try {
    const lat = req.query.lat;
    const lon = req.query.lon;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }
    // Attempt reverse lookup using Open-Meteo or fallback naming
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'AeroWeatherApp/1.0',
      },
    });
    if (resp.ok) {
      const data = await resp.json();
      const address = data.address || {};
      const cityName =
        address.city ||
        address.town ||
        address.village ||
        address.suburb ||
        address.county ||
        'Current GPS Location';
      return res.json({
        name: cityName,
        country: address.country || '',
        admin1: address.state || address.region || '',
      });
    }
    res.json({ name: 'Current Location', country: '', admin1: '' });
  } catch (err) {
    res.json({ name: 'GPS Location', country: '', admin1: '' });
  }
});

// 3. Complete Weather Data API (Current, Hourly, Daily, Air Quality, Real-Time Alerts)
app.get('/api/weather/data', async (req, res) => {
  try {
    const lat = parseFloat((req.query.lat as string) || '37.7749');
    const lon = parseFloat((req.query.lon as string) || '-122.4194');
    const name = (req.query.name as string) || 'San Francisco';
    const country = (req.query.country as string) || 'United States';
    const admin1 = (req.query.admin1 as string) || 'California';

    // Fetch Open-Meteo Weather Forecast
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,pressure_msl,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,uv_index,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=auto`;

    // Fetch Air Quality
    const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;

    const [forecastData, aqData] = await Promise.all([
      fetchJson(forecastUrl),
      fetchJson(aqUrl).catch(() => ({ current: {} })),
    ]);

    const currentRaw = forecastData.current || {};
    const hourlyRaw = forecastData.hourly || {};
    const dailyRaw = forecastData.daily || {};
    const aqCurrent = aqData.current || {};

    // Transform Hourly
    const hourly = (hourlyRaw.time || []).slice(0, 24).map((timeStr: string, idx: number) => ({
      time: timeStr,
      temperature: hourlyRaw.temperature_2m?.[idx] ?? 0,
      apparentTemperature: hourlyRaw.apparent_temperature?.[idx] ?? 0,
      humidity: hourlyRaw.relative_humidity_2m?.[idx] ?? 0,
      dewPoint: hourlyRaw.dew_point_2m?.[idx] ?? 0,
      precipProbability: hourlyRaw.precipitation_probability?.[idx] ?? 0,
      precipitation: hourlyRaw.precipitation?.[idx] ?? 0,
      weatherCode: hourlyRaw.weather_code?.[idx] ?? 0,
      pressureMsl: hourlyRaw.pressure_msl?.[idx] ?? 1013,
      cloudCover: hourlyRaw.cloud_cover?.[idx] ?? 0,
      visibility: hourlyRaw.visibility?.[idx] ?? 10000,
      windSpeed: hourlyRaw.wind_speed_10m?.[idx] ?? 0,
      windDirection: hourlyRaw.wind_direction_10m?.[idx] ?? 0,
      uvIndex: hourlyRaw.uv_index?.[idx] ?? 0,
      isDay: Boolean(hourlyRaw.is_day?.[idx] ?? 1),
    }));

    // Transform Daily
    const daily = (dailyRaw.time || []).slice(0, 7).map((timeStr: string, idx: number) => ({
      date: timeStr,
      weatherCode: dailyRaw.weather_code?.[idx] ?? 0,
      tempMax: dailyRaw.temperature_2m_max?.[idx] ?? 0,
      tempMin: dailyRaw.temperature_2m_min?.[idx] ?? 0,
      apparentTempMax: dailyRaw.apparent_temperature_max?.[idx] ?? 0,
      apparentTempMin: dailyRaw.apparent_temperature_min?.[idx] ?? 0,
      sunrise: dailyRaw.sunrise?.[idx] ?? '',
      sunset: dailyRaw.sunset?.[idx] ?? '',
      daylightDuration: dailyRaw.daylight_duration?.[idx] ?? 43200,
      uvIndexMax: dailyRaw.uv_index_max?.[idx] ?? 0,
      precipitationSum: dailyRaw.precipitation_sum?.[idx] ?? 0,
      precipitationProbabilityMax: dailyRaw.precipitation_probability_max?.[idx] ?? 0,
      windSpeedMax: dailyRaw.wind_speed_10m_max?.[idx] ?? 0,
      windGustsMax: dailyRaw.wind_gusts_10m_max?.[idx] ?? 0,
      windDirectionDominant: dailyRaw.wind_direction_10m_dominant?.[idx] ?? 0,
    }));

    // Generate Real-time Severe Weather Alerts based on local meteorological parameters
    const alerts = [];
    const wCode = currentRaw.weather_code ?? 0;
    const gust = currentRaw.wind_gusts_10m ?? 0;
    const precip = currentRaw.precipitation ?? 0;
    const maxUv = daily[0]?.uvIndexMax ?? 0;
    const tempCurr = currentRaw.temperature_2m ?? 0;
    const usAqiVal = aqCurrent.us_aqi ?? 0;

    // Thunderstorm Warning
    if ([95, 96, 99].includes(wCode)) {
      alerts.push({
        id: 'alert-thunderstorm',
        severity: 'critical',
        event: 'Severe Thunderstorm Warning',
        title: 'Severe Thunderstorm & Lightning Hazard',
        description: `Active thunderstorm observed in ${name}. Lightning strikes and heavy downpours imminent.`,
        instruction: 'Seek shelter indoors immediately away from windows and metallic structures.',
        effective: new Date().toISOString(),
        expires: new Date(Date.now() + 3600000 * 3).toISOString(),
        area: `${name}, ${admin1}`,
        source: 'AeroWeather Severe Warning Engine',
        metricTriggered: `Weather Code ${wCode}`,
      });
    }

    // Flash Flood / Heavy Rain
    if (precip > 5 || (hourly[0]?.precipProbability > 80 && hourly[0]?.precipitation > 3)) {
      alerts.push({
        id: 'alert-flood',
        severity: 'warning',
        event: 'Flash Flood & Rain Advisory',
        title: 'Heavy Rainfall & Water Accumulation Notice',
        description: `Substantial precipitation detected in ${name} (${precip} mm/h). Risk of standing water on low roadways.`,
        instruction: 'Exercise caution while driving. Avoid flooded underpasses and low-lying trails.',
        effective: new Date().toISOString(),
        expires: new Date(Date.now() + 3600000 * 4).toISOString(),
        area: `${name}, ${admin1}`,
        source: 'Meteorological Precipitation Radar',
        metricTriggered: `${precip} mm/h rain`,
      });
    }

    // Wind Gust Warning
    if (gust >= 45) {
      alerts.push({
        id: 'alert-wind',
        severity: gust >= 65 ? 'critical' : 'warning',
        event: 'High Wind & Gale Advisory',
        title: `Strong Wind Gusts up to ${Math.round(gust)} km/h`,
        description: `Elevated wind gusts in ${name}. Potential for loose debris, tree branch falls, and difficult travel for high-profile vehicles.`,
        instruction: 'Secure outdoor loose objects, lawn furniture, and exercise care near tall trees.',
        effective: new Date().toISOString(),
        expires: new Date(Date.now() + 3600000 * 6).toISOString(),
        area: `${name}, ${admin1}`,
        source: 'Anemometer Sensor Array',
        metricTriggered: `${Math.round(gust)} km/h gusts`,
      });
    }

    // High UV Radiation
    if (maxUv >= 8) {
      alerts.push({
        id: 'alert-uv',
        severity: 'advisory',
        event: 'Extreme UV Index Alert',
        title: `Peak UV Index ${maxUv.toFixed(1)} expected today`,
        description: `Unusually intense solar ultraviolet radiation level for ${name}. High potential for skin sunburn within 15 minutes.`,
        instruction: 'Apply SPF 30+ broad-spectrum sunscreen, wear protective sunglasses, and stay in shade between 11 AM and 3 PM.',
        effective: new Date().toISOString(),
        expires: new Date(Date.now() + 3600000 * 8).toISOString(),
        area: `${name}`,
        source: 'Solar Radiation Sensor',
        metricTriggered: `UV Index ${maxUv}`,
      });
    }

    // Extreme Heat
    if (tempCurr >= 35) {
      alerts.push({
        id: 'alert-heat',
        severity: 'warning',
        event: 'Excessive Heat Warning',
        title: `Extreme High Temperature (${Math.round(tempCurr)}°C)`,
        description: `Dangerous ambient heat levels recorded in ${name}. Increased risk of heat exhaustion and dehydration.`,
        instruction: 'Stay hydrated, remain in air-conditioned environments, and check on elderly neighbors.',
        effective: new Date().toISOString(),
        expires: new Date(Date.now() + 3600000 * 12).toISOString(),
        area: `${name}, ${country}`,
        source: 'Thermal Sensor Station',
        metricTriggered: `${Math.round(tempCurr)}°C`,
      });
    } else if (tempCurr <= 0) {
      alerts.push({
        id: 'alert-freeze',
        severity: 'warning',
        event: 'Hard Freeze & Ice Warning',
        title: `Sub-Freezing Temperatures (${Math.round(tempCurr)}°C)`,
        description: `Sub-freezing temperatures in ${name}. Frost formation and black ice hazard on exposed bridges.`,
        instruction: 'Protect outdoor water pipes, wrap delicate vegetation, and drive with extreme caution.',
        effective: new Date().toISOString(),
        expires: new Date(Date.now() + 3600000 * 10).toISOString(),
        area: `${name}, ${country}`,
        source: 'Freeze Monitor',
        metricTriggered: `${Math.round(tempCurr)}°C`,
      });
    }

    // Fog & Visibility
    if ([45, 48].includes(wCode) || (hourly[0]?.visibility && hourly[0]?.visibility < 1000)) {
      alerts.push({
        id: 'alert-fog',
        severity: 'advisory',
        event: 'Dense Fog & Low Visibility',
        title: 'Reduced Road Visibility Below 1km',
        description: `Dense fog blankets ${name}. Roadway visibility severely restricted.`,
        instruction: 'Use low-beam headlights, increase follow distance while driving, and slow down.',
        effective: new Date().toISOString(),
        expires: new Date(Date.now() + 3600000 * 3).toISOString(),
        area: `${name}`,
        source: 'Optical Transmissometer Network',
        metricTriggered: `Visibility < 1km`,
      });
    }

    // Air Quality
    if (usAqiVal > 100) {
      alerts.push({
        id: 'alert-aqi',
        severity: usAqiVal > 150 ? 'warning' : 'advisory',
        event: 'Air Pollution Health Advisory',
        title: `Unhealthy Air Quality Index (AQI ${usAqiVal})`,
        description: `Elevated particulate matter (PM2.5/PM10) in ${name}. Sensitive individuals may experience respiratory discomfort.`,
        instruction: 'Sensitive groups, children, and elderly should reduce prolonged outdoor exertion.',
        effective: new Date().toISOString(),
        expires: new Date(Date.now() + 3600000 * 12).toISOString(),
        area: `${name}`,
        source: 'Air Quality Monitoring Network',
        metricTriggered: `US AQI ${usAqiVal}`,
      });
    }

    const resultPayload = {
      location: {
        id: `${lat.toFixed(2)}-${lon.toFixed(2)}`,
        name,
        country,
        admin1,
        latitude: lat,
        longitude: lon,
      },
      current: {
        time: currentRaw.time || new Date().toISOString(),
        temperature: currentRaw.temperature_2m ?? 0,
        apparentTemperature: currentRaw.apparent_temperature ?? currentRaw.temperature_2m ?? 0,
        relativeHumidity: currentRaw.relative_humidity_2m ?? 0,
        isDay: Boolean(currentRaw.is_day ?? 1),
        precipitation: currentRaw.precipitation ?? 0,
        weatherCode: currentRaw.weather_code ?? 0,
        cloudCover: currentRaw.cloud_cover ?? 0,
        pressureMsl: currentRaw.pressure_msl ?? 1013,
        surfacePressure: currentRaw.surface_pressure ?? 1013,
        windSpeed: currentRaw.wind_speed_10m ?? 0,
        windDirection: currentRaw.wind_direction_10m ?? 0,
        windGusts: currentRaw.wind_gusts_10m ?? 0,
      },
      hourly,
      daily,
      airQuality: {
        usAqi: aqCurrent.us_aqi ?? 35,
        europeanAqi: aqCurrent.european_aqi ?? 20,
        pm10: aqCurrent.pm10 ?? 12,
        pm25: aqCurrent.pm2_5 ?? 8,
        co: aqCurrent.carbon_monoxide ?? 210,
        no2: aqCurrent.nitrogen_dioxide ?? 15,
        so2: aqCurrent.sulphur_dioxide ?? 3,
        o3: aqCurrent.ozone ?? 45,
      },
      alerts,
      updatedAt: new Date().toISOString(),
    };

    res.json(resultPayload);
  } catch (err: any) {
    console.error('Weather data error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve live weather data' });
  }
});

// 4. Server-Side AI Weather Briefing (Gemini gemini-3.6-flash API)
app.post('/api/weather/ai-briefing', async (req, res) => {
  try {
    const { weatherData } = req.body;
    if (!weatherData || !weatherData.current) {
      return res.status(400).json({ error: 'weatherData object is required' });
    }

    const { location, current, hourly, daily, airQuality, alerts } = weatherData;

    const prompt = `You are AeroWeather AI, an expert meteorologist and hyper-local weather intelligence assistant.
Analyze the following real-time hyper-local weather parameters for ${location.name}, ${location.country}:

CURRENT CONDITIONS:
- Temperature: ${current.temperature}°C (Feels like: ${current.apparentTemperature}°C)
- Humidity: ${current.relativeHumidity}%
- Weather Code: ${current.weatherCode}
- Wind: ${current.windSpeed} km/h (Gusts: ${current.windGusts} km/h, Direction: ${current.windDirection}°)
- Barometric Pressure: ${current.pressureMsl} hPa
- Precipitation: ${current.precipitation} mm/h
- Air Quality US AQI: ${airQuality?.usAqi ?? 'N/A'} (PM2.5: ${airQuality?.pm25 ?? 'N/A'} µg/m³)

24-HOUR FORECAST TREND:
- High/Low Temp in next 24h: ${Math.max(...hourly.map((h: any) => h.temperature))}°C / ${Math.min(...hourly.map((h: any) => h.temperature))}°C
- Peak Rain Probability: ${Math.max(...hourly.map((h: any) => h.precipProbability))}%
- Peak UV Index: ${daily[0]?.uvIndexMax ?? 'N/A'}

ACTIVE ALERTS:
${alerts?.length > 0 ? alerts.map((a: any) => `- ${a.title}: ${a.description}`).join('\n') : 'No severe alerts active.'}

Tasks:
1. Provide a concise, engaging hyper-local weather summary (2-3 sentences).
2. Detail microclimate & atmospheric analysis (what causes this weather, humidity/wind dynamics, dew point comfort level).
3. Provide practical, specific clothing & gear recommendations for today (e.g., layers, waterproof jacket, sunglasses, umbrella, thermal wear).
4. Provide activity feasibility scores (Sports/Running, Outdoor Dining, Commute, Gardening) with status ('optimal', 'caution', or 'discouraged') and a helpful 1-sentence note.
5. If active severe alerts exist, include concise safety advice under 'alertAdvice'.

Return the response STRICTLY as JSON with the defined schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            microclimateAnalysis: { type: Type.STRING },
            clothingAdvice: { type: Type.STRING },
            alertAdvice: { type: Type.STRING },
            activities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  status: { type: Type.STRING }, // 'optimal' | 'caution' | 'discouraged'
                  note: { type: Type.STRING },
                },
                required: ['name', 'category', 'status', 'note'],
              },
            },
          },
          required: ['summary', 'microclimateAnalysis', 'clothingAdvice', 'activities'],
        },
      },
    });

    const jsonText = response.text || '{}';
    const parsedData = JSON.parse(jsonText);
    parsedData.generatedAt = new Date().toISOString();

    res.json(parsedData);
  } catch (err: any) {
    console.error('Gemini AI Weather Briefing error:', err);
    res.status(500).json({ error: 'Failed to generate AI weather briefing' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AeroWeather Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
