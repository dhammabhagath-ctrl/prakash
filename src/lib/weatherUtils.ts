import { LocationItem, TempUnit, WindUnit, PrecipUnit, PressureUnit } from '../types';

export const DEFAULT_LOCATIONS: LocationItem[] = [
  {
    id: 'san-francisco',
    name: 'San Francisco',
    latitude: 37.7749,
    longitude: -122.4194,
    country: 'United States',
    admin1: 'California',
    timezone: 'America/Los_Angeles',
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    latitude: 35.6762,
    longitude: 139.6503,
    country: 'Japan',
    admin1: 'Tokyo',
    timezone: 'Asia/Tokyo',
  },
  {
    id: 'london',
    name: 'London',
    latitude: 51.5074,
    longitude: -0.1278,
    country: 'United Kingdom',
    admin1: 'England',
    timezone: 'Europe/London',
  },
  {
    id: 'new-york',
    name: 'New York',
    latitude: 40.7128,
    longitude: -74.006,
    country: 'United States',
    admin1: 'New York',
    timezone: 'America/New_York',
  },
  {
    id: 'sydney',
    name: 'Sydney',
    latitude: -33.8688,
    longitude: 151.2093,
    country: 'Australia',
    admin1: 'New South Wales',
    timezone: 'Australia/Sydney',
  },
  {
    id: 'paris',
    name: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    country: 'France',
    admin1: 'Île-de-France',
    timezone: 'Europe/Paris',
  },
  {
    id: 'singapore',
    name: 'Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    country: 'Singapore',
    admin1: 'Singapore',
    timezone: 'Asia/Singapore',
  },
  {
    id: 'zurich',
    name: 'Zurich',
    latitude: 47.3769,
    longitude: 8.5417,
    country: 'Switzerland',
    admin1: 'Zurich',
    timezone: 'Europe/Zurich',
  },
];

export function convertTemp(valCelsius: number, unit: TempUnit): number {
  if (unit === 'f') {
    return Math.round((valCelsius * 9) / 5 + 32);
  }
  return Math.round(valCelsius);
}

export function formatTemp(valCelsius: number, unit: TempUnit): string {
  return `${convertTemp(valCelsius, unit)}°${unit.toUpperCase()}`;
}

export function convertWind(speedKmh: number, unit: WindUnit): { value: number; unitLabel: string } {
  if (unit === 'mph') {
    return { value: Math.round(speedKmh * 0.621371), unitLabel: 'mph' };
  }
  if (unit === 'ms') {
    return { value: Math.round((speedKmh / 3.6) * 10) / 10, unitLabel: 'm/s' };
  }
  return { value: Math.round(speedKmh), unitLabel: 'km/h' };
}

export function convertPrecip(mm: number, unit: PrecipUnit): { value: number; unitLabel: string } {
  if (unit === 'inch') {
    return { value: Math.round((mm / 25.4) * 100) / 100, unitLabel: 'in' };
  }
  return { value: Math.round(mm * 10) / 10, unitLabel: 'mm' };
}

export function convertPressure(hpa: number, unit: PressureUnit): { value: number; unitLabel: string } {
  if (unit === 'inHg') {
    return { value: Math.round((hpa * 0.02953) * 100) / 100, unitLabel: 'inHg' };
  }
  return { value: Math.round(hpa), unitLabel: 'hPa' };
}

export function getWindCardinal(deg: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 45) % 8;
  return directions[index];
}

export function getAqiInfo(usAqi: number): {
  label: string;
  color: string;
  bgColor: string;
  description: string;
} {
  if (usAqi <= 50) {
    return {
      label: 'Good',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: 'Air quality is satisfactory and poses little or no risk.',
    };
  }
  if (usAqi <= 100) {
    return {
      label: 'Moderate',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      description: 'Air quality is acceptable for most people.',
    };
  }
  if (usAqi <= 150) {
    return {
      label: 'Unhealthy for Sensitive Groups',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'Members of sensitive groups may experience health effects.',
    };
  }
  if (usAqi <= 200) {
    return {
      label: 'Unhealthy',
      color: 'text-red-400',
      bgColor: 'bg-red-500/20 text-red-300 border-red-500/30',
      description: 'Everyone may begin to experience health effects.',
    };
  }
  if (usAqi <= 300) {
    return {
      label: 'Very Unhealthy',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      description: 'Health alert: risk of serious health effects for everyone.',
    };
  }
  return {
    label: 'Hazardous',
    color: 'text-rose-600',
    bgColor: 'bg-rose-600/20 text-rose-300 border-rose-600/30',
    description: 'Health warning of emergency conditions.',
  };
}

export function getUvInfo(uvIndex: number): {
  label: string;
  color: string;
  advice: string;
} {
  if (uvIndex <= 2) {
    return { label: 'Low', color: 'text-emerald-400', advice: 'No protection required.' };
  }
  if (uvIndex <= 5) {
    return { label: 'Moderate', color: 'text-yellow-400', advice: 'Wear sunglasses & SPF 30+.' };
  }
  if (uvIndex <= 7) {
    return { label: 'High', color: 'text-amber-500', advice: 'Protection needed. Seek shade at mid-day.' };
  }
  if (uvIndex <= 10) {
    return { label: 'Very High', color: 'text-red-400', advice: 'Extra protection required. Avoid sun 11-4.' };
  }
  return { label: 'Extreme', color: 'text-purple-400', advice: 'Take full precautions. Unprotected skin burns fast.' };
}

export function formatTime(isoString: string, timezone?: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return isoString.substring(11, 16);
  }
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return isoString;
  }
}
