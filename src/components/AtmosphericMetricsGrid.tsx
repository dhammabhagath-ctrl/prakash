import React from 'react';
import {
  Gauge,
  Sun,
  Wind,
  Droplets,
  Sunrise,
  Sunset,
  Moon,
  Compass,
  Activity,
  Shield,
  Thermometer,
  CloudSun,
} from 'lucide-react';
import { WeatherData, UnitsSettings } from '../types';
import {
  convertWind,
  convertPressure,
  getWindCardinal,
  getAqiInfo,
  getUvInfo,
  formatTime,
  formatTemp,
} from '../lib/weatherUtils';

interface AtmosphericMetricsGridProps {
  weatherData: WeatherData;
  units: UnitsSettings;
}

export const AtmosphericMetricsGrid: React.FC<AtmosphericMetricsGridProps> = ({
  weatherData,
  units,
}) => {
  const { current, daily, airQuality } = weatherData;
  const todayDaily = daily[0] || {};

  const windInfo = convertWind(current.windSpeed, units.wind);
  const gustInfo = convertWind(current.windGusts, units.wind);
  const pressureInfo = convertPressure(current.pressureMsl, units.pressure);
  const aqiInfo = getAqiInfo(airQuality.usAqi);
  const uvInfo = getUvInfo(todayDaily.uvIndexMax || 0);

  // Beaufort Wind Scale Name Helper
  const getBeaufortLabel = (speedKmh: number): string => {
    if (speedKmh < 2) return 'Calm';
    if (speedKmh < 12) return 'Light Breeze';
    if (speedKmh < 30) return 'Moderate Breeze';
    if (speedKmh < 50) return 'Strong Breeze';
    if (speedKmh < 75) return 'Gale Force';
    return 'Storm / Hurricane';
  };

  return (
    <div id="atmospheric-bento-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1. Air Quality Index Detail Bento Card */}
      <div className="p-5 bg-slate-900/80 border border-slate-800/90 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-sky-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Air Quality Index (AQI)
            </h3>
          </div>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${aqiInfo.bgColor}`}>
            {aqiInfo.label}
          </span>
        </div>

        {/* AQI Score & Progress Bar */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-100">{airQuality.usAqi}</span>
            <span className="text-xs text-slate-400 font-mono">US AQI Score</span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (airQuality.usAqi / 300) * 100)}%`,
                backgroundColor:
                  airQuality.usAqi <= 50
                    ? '#10b981'
                    : airQuality.usAqi <= 100
                    ? '#eab308'
                    : airQuality.usAqi <= 150
                    ? '#f97316'
                    : '#ef4444',
              }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-tight">
            {aqiInfo.description}
          </p>
        </div>

        {/* Pollutants Breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[10px]">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-slate-400 block font-semibold">PM2.5</span>
            <span className="font-bold text-slate-200">{airQuality.pm25} µg/m³</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-slate-400 block font-semibold">PM10</span>
            <span className="font-bold text-slate-200">{airQuality.pm10} µg/m³</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-slate-400 block font-semibold">Ozone (O₃)</span>
            <span className="font-bold text-slate-200">{airQuality.o3} µg/m³</span>
          </div>
        </div>
      </div>

      {/* 2. Solar Radiation & UV Index Gauge Card */}
      <div className="p-5 bg-slate-900/80 border border-slate-800/90 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              UV Index & Solar Protection
            </h3>
          </div>
          <span className={`text-xs font-bold ${uvInfo.color}`}>
            {uvInfo.label}
          </span>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-100">
              {todayDaily.uvIndexMax ? todayDaily.uvIndexMax.toFixed(1) : '0.0'}
            </span>
            <span className="text-xs text-slate-400 font-mono">Max Index Today</span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-purple-600 transition-all duration-500"
              style={{
                width: `${Math.min(100, ((todayDaily.uvIndexMax || 0) / 12) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-amber-200/90 mt-2 flex items-center gap-1 font-medium">
            <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            {uvInfo.advice}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">
            Peak UV Window
          </span>
          <span className="font-bold text-slate-100">11:30 AM – 3:15 PM</span>
        </div>
      </div>

      {/* 3. Wind Vectors & Direction Compass Card */}
      <div className="p-5 bg-slate-900/80 border border-slate-800/90 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Wind Dynamics
            </h3>
          </div>
          <span className="text-xs font-bold text-sky-400 font-mono">
            {getBeaufortLabel(current.windSpeed)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-3xl font-black text-slate-100">
              {windInfo.value} <span className="text-sm font-normal text-slate-400">{windInfo.unitLabel}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 font-medium">
              Direction: <strong className="text-slate-200">{getWindCardinal(current.windDirection)} ({current.windDirection}°)</strong>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-medium">
              Max Gusts: <strong className="text-amber-300">{gustInfo.value} {gustInfo.unitLabel}</strong>
            </div>
          </div>

          {/* Compass Graphic */}
          <div className="relative w-16 h-16 rounded-full border-2 border-slate-700 bg-slate-950 flex items-center justify-center shrink-0">
            <span className="absolute top-0.5 text-[8px] font-bold text-slate-400">N</span>
            <span className="absolute bottom-0.5 text-[8px] font-bold text-slate-400">S</span>
            <span className="absolute left-1 text-[8px] font-bold text-slate-400">W</span>
            <span className="absolute right-1 text-[8px] font-bold text-slate-400">E</span>
            <Compass
              className="w-8 h-8 text-sky-400 transition-transform duration-700"
              style={{ transform: `rotate(${current.windDirection}deg)` }}
            />
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">
            Wind Impact Assessment
          </span>
          <span className="font-medium text-slate-200">
            {current.windGusts > 40 ? 'High wind caution for light structures.' : 'Normal breeze condition.'}
          </span>
        </div>
      </div>

      {/* 4. Humidity & Dewpoint Comfort Gauge */}
      <div className="p-5 bg-slate-900/80 border border-slate-800/90 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Humidity & Dew Point
            </h3>
          </div>
          <span className="text-xs font-bold text-blue-300">
            {current.relativeHumidity > 70 ? 'Humid' : current.relativeHumidity < 30 ? 'Dry' : 'Comfortable'}
          </span>
        </div>

        <div>
          <div className="text-3xl font-black text-slate-100">
            {current.relativeHumidity}%
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${current.relativeHumidity}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Cloud Cover: <strong className="text-slate-200">{current.cloudCover}%</strong>
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">
            Barometric Pressure
          </span>
          <span className="font-bold text-slate-100">
            {pressureInfo.value} {pressureInfo.unitLabel} (Steady)
          </span>
        </div>
      </div>

      {/* 5. Sun & Moon Cycle Curve Card */}
      <div className="p-5 bg-slate-900/80 border border-slate-800/90 rounded-3xl shadow-xl flex flex-col justify-between space-y-4 md:col-span-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sunrise className="w-5 h-5 text-amber-300" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Solar & Lunar Orbit Tracking
            </h3>
          </div>
          <span className="text-xs font-bold text-amber-300 font-mono">
            Daylight: {Math.floor((todayDaily.daylightDuration || 43200) / 3600)}h {Math.floor(((todayDaily.daylightDuration || 43200) % 3600) / 60)}m
          </span>
        </div>

        {/* Solar Curve Graphic */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Sunrise className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Sunrise</span>
              <span className="text-sm font-bold text-slate-100">{formatTime(todayDaily.sunrise)}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-600/30">
              <Sunset className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Sunset</span>
              <span className="text-sm font-bold text-slate-100">{formatTime(todayDaily.sunset)}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Moon Phase</span>
              <span className="text-sm font-bold text-slate-100">Waxing Crescent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
