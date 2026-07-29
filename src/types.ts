export interface LocationItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string; // State or region
  timezone?: string;
  elevation?: number;
}

export type TempUnit = 'c' | 'f';
export type WindUnit = 'kmh' | 'mph' | 'ms';
export type PrecipUnit = 'mm' | 'inch';
export type PressureUnit = 'hpa' | 'inHg';

export interface UnitsSettings {
  temp: TempUnit;
  wind: WindUnit;
  precip: PrecipUnit;
  pressure: PressureUnit;
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  isDay: boolean;
  precipitation: number;
  weatherCode: number;
  cloudCover: number;
  pressureMsl: number;
  surfacePressure: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
}

export interface HourlyForecastItem {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  dewPoint: number;
  precipProbability: number;
  precipitation: number;
  weatherCode: number;
  pressureMsl: number;
  cloudCover: number;
  visibility: number;
  windSpeed: number;
  windDirection: number;
  uvIndex: number;
  isDay: boolean;
}

export interface DailyForecastItem {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  apparentTempMax: number;
  apparentTempMin: number;
  sunrise: string;
  sunset: string;
  daylightDuration: number;
  uvIndexMax: number;
  precipitationSum: number;
  precipitationProbabilityMax: number;
  windSpeedMax: number;
  windGustsMax: number;
  windDirectionDominant: number;
}

export interface AirQualityData {
  usAqi: number;
  europeanAqi: number;
  pm10: number;
  pm25: number;
  co: number;
  no2: number;
  so2: number;
  o3: number;
}

export interface WeatherData {
  location: LocationItem;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  airQuality: AirQualityData;
  updatedAt: string;
}

export type AlertSeverity = 'critical' | 'warning' | 'advisory' | 'info';

export interface WeatherAlert {
  id: string;
  severity: AlertSeverity;
  event: string;
  title: string;
  description: string;
  instruction: string;
  effective: string;
  expires: string;
  area: string;
  source: string;
  metricTriggered?: string;
}

export interface CustomAlertRule {
  id: string;
  label: string;
  metric: 'temp_low' | 'temp_high' | 'rain_prob' | 'wind_speed' | 'uv_index' | 'aqi';
  condition: 'gt' | 'lt';
  value: number;
  enabled: boolean;
}

export interface ActivityRecommendation {
  name: string;
  category: 'Sports' | 'Commute' | 'Outdoor' | 'Health';
  status: 'optimal' | 'caution' | 'discouraged';
  note: string;
}

export interface GeminiAIBriefing {
  summary: string;
  microclimateAnalysis: string;
  clothingAdvice: string;
  activities: ActivityRecommendation[];
  alertAdvice?: string;
  generatedAt: string;
}
