import React, { useState } from 'react';
import {
  Clock,
  CloudRain,
  Wind,
  Sun,
  Cloud,
  ChevronRight,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import { HourlyForecastItem, UnitsSettings } from '../types';
import { getWeatherCodeInfo } from '../lib/weatherCodes';
import {
  formatTemp,
  convertWind,
  convertPrecip,
  formatTime,
  getWindCardinal,
} from '../lib/weatherUtils';

interface HourlyForecastProps {
  hourly: HourlyForecastItem[];
  units: UnitsSettings;
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({ hourly, units }) => {
  const [selectedHourIndex, setSelectedHourIndex] = useState<number>(0);

  if (!hourly || hourly.length === 0) return null;

  const displayHours = hourly.slice(0, 24);
  const selectedHour = displayHours[selectedHourIndex] || displayHours[0];

  // Graph Data Math
  const temps = displayHours.map((h) => h.temperature);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const tempRange = maxTemp - minTemp || 1;

  return (
    <div id="hourly-forecast-container" className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-sky-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            24-Hour Hyper-Local Timeline
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Interactive Hourly Trend
        </span>
      </div>

      {/* Visual Canvas/SVG Curve Chart */}
      <div className="relative h-28 bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80 overflow-hidden flex items-end">
        {/* SVG Bezier Line Chart */}
        <svg className="absolute inset-0 w-full h-full p-2 overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${displayHours.length - 1} 100`}>
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path
            d={
              displayHours.reduce((acc, h, i) => {
                const y = 85 - ((h.temperature - minTemp) / tempRange) * 65;
                return `${acc} ${i === 0 ? 'M' : 'L'} ${i} ${y}`;
              }, '') + ` L ${displayHours.length - 1} 100 L 0 100 Z`
            }
            fill="url(#tempGradient)"
          />

          {/* Line Path */}
          <path
            d={displayHours.reduce((acc, h, i) => {
              const y = 85 - ((h.temperature - minTemp) / tempRange) * 65;
              return `${acc} ${i === 0 ? 'M' : 'L'} ${i} ${y}`;
            }, '')}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Points */}
          {displayHours.map((h, i) => {
            const y = 85 - ((h.temperature - minTemp) / tempRange) * 65;
            const isSelected = i === selectedHourIndex;
            return (
              <circle
                key={i}
                cx={i}
                cy={y}
                r={isSelected ? 3.5 : 1.5}
                fill={isSelected ? '#38bdf8' : '#ffffff'}
                stroke={isSelected ? '#0284c7' : '#38bdf8'}
                strokeWidth={isSelected ? 1.5 : 0.5}
                className="cursor-pointer transition-all"
                onClick={() => setSelectedHourIndex(i)}
              />
            );
          })}
        </svg>

        {/* Floating Labels Overlay */}
        <div className="relative z-10 w-full flex justify-between text-[10px] font-mono text-slate-400 pointer-events-none px-1">
          <span>Now ({formatTemp(displayHours[0].temperature, units.temp)})</span>
          <span>Peak: {formatTemp(maxTemp, units.temp)}</span>
          <span>Low: {formatTemp(minTemp, units.temp)}</span>
          <span>+24h</span>
        </div>
      </div>

      {/* Horizontal Scrollable Hourly Cards */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        {displayHours.map((hour, idx) => {
          const codeInfo = getWeatherCodeInfo(hour.weatherCode);
          const isSelected = idx === selectedHourIndex;
          const windInfo = convertWind(hour.windSpeed, units.wind);

          return (
            <button
              key={idx}
              onClick={() => setSelectedHourIndex(idx)}
              className={`shrink-0 w-24 p-3 rounded-2xl border text-center transition-all ${
                isSelected
                  ? 'bg-sky-500/20 border-sky-500/60 shadow-lg shadow-sky-500/10 scale-105'
                  : 'bg-slate-950/50 hover:bg-slate-800/80 border-slate-800 text-slate-300'
              }`}
            >
              <div className="text-[11px] font-semibold text-slate-400 font-mono">
                {idx === 0 ? 'Now' : formatTime(hour.time)}
              </div>

              <div className="my-2 text-xs font-bold text-sky-400 truncate">
                {codeInfo.label.split(' ')[0]}
              </div>

              <div className="text-base font-black text-slate-100">
                {formatTemp(hour.temperature, units.temp)}
              </div>

              {/* Rain Probability Indicator */}
              <div className="mt-2 text-[10px] flex items-center justify-center gap-1 text-sky-300">
                <CloudRain className="w-3 h-3 text-sky-400" />
                <span className="font-bold">{hour.precipProbability}%</span>
              </div>

              {/* Wind Speed */}
              <div className="mt-1 text-[9px] text-slate-400 flex items-center justify-center gap-0.5">
                <Wind className="w-2.5 h-2.5" />
                <span>{windInfo.value}{windInfo.unitLabel}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Hour Details Box */}
      {selectedHour && (
        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] block">Time Window</span>
            <span className="font-bold text-slate-100">{formatTime(selectedHour.time)}</span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block">Precipitation Prob / Depth</span>
            <span className="font-bold text-sky-300">
              {selectedHour.precipProbability}% ({selectedHour.precipitation} mm)
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block">Wind & Direction</span>
            <span className="font-bold text-slate-100">
              {convertWind(selectedHour.windSpeed, units.wind).value} {units.wind} ({getWindCardinal(selectedHour.windDirection)})
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block">UV Index / Dew Point</span>
            <span className="font-bold text-amber-300">
              UV {selectedHour.uvIndex} • Dew {formatTemp(selectedHour.dewPoint, units.temp)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
