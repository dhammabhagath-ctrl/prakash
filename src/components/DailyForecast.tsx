import React, { useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Sun,
  Wind,
  Sunrise,
  Sunset,
  ArrowUp,
  ArrowDown,
  Droplets,
} from 'lucide-react';
import { DailyForecastItem, UnitsSettings } from '../types';
import { getWeatherCodeInfo } from '../lib/weatherCodes';
import {
  formatDate,
  formatTemp,
  convertWind,
  convertPrecip,
  formatTime,
  getUvInfo,
} from '../lib/weatherUtils';

interface DailyForecastProps {
  daily: DailyForecastItem[];
  units: UnitsSettings;
}

export const DailyForecast: React.FC<DailyForecastProps> = ({ daily, units }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (!daily || daily.length === 0) return null;

  // Global temp range calculation for proportional bar positioning
  const allMaxs = daily.map((d) => d.tempMax);
  const allMins = daily.map((d) => d.tempMin);
  const globalMin = Math.min(...allMins);
  const globalMax = Math.max(...allMaxs);
  const globalRange = globalMax - globalMin || 1;

  return (
    <div id="daily-forecast-container" className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            7-Day Extended Forecast
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Hyper-Local Trend
        </span>
      </div>

      {/* Daily List */}
      <div className="space-y-2.5">
        {daily.map((dayItem, idx) => {
          const codeInfo = getWeatherCodeInfo(dayItem.weatherCode);
          const isExpanded = expandedIndex === idx;

          // Bar math percentages
          const leftPercent = ((dayItem.tempMin - globalMin) / globalRange) * 100;
          const widthPercent =
            Math.max(10, ((dayItem.tempMax - dayItem.tempMin) / globalRange) * 100);

          const isToday = idx === 0;
          const precipInfo = convertPrecip(dayItem.precipitationSum, units.precip);
          const windMaxInfo = convertWind(dayItem.windSpeedMax, units.wind);
          const uvInfo = getUvInfo(dayItem.uvIndexMax);

          return (
            <div
              key={dayItem.date}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isToday
                  ? 'bg-sky-950/20 border-sky-500/40 shadow-md'
                  : 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800/80'
              }`}
            >
              {/* Row Header */}
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="w-full p-3.5 flex items-center justify-between text-left gap-3 focus:outline-none"
              >
                {/* Weekday & Condition */}
                <div className="w-32 shrink-0">
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>{isToday ? 'Today' : formatDate(dayItem.date)}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                    {codeInfo.label}
                  </div>
                </div>

                {/* Rain probability & Volume */}
                <div className="w-20 text-center shrink-0 hidden sm:block">
                  <div className="text-xs font-bold text-sky-300 flex items-center justify-center gap-1">
                    <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                    <span>{dayItem.precipitationProbabilityMax}%</span>
                  </div>
                  {dayItem.precipitationSum > 0 && (
                    <div className="text-[10px] text-slate-400">
                      {precipInfo.value} {precipInfo.unitLabel}
                    </div>
                  )}
                </div>

                {/* Temperature Range Bar */}
                <div className="flex-1 max-w-xs mx-2 flex items-center gap-2">
                  <span className="text-xs font-bold text-sky-300 w-8 text-right shrink-0">
                    {formatTemp(dayItem.tempMin, units.temp)}
                  </span>

                  <div className="relative flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                    />
                  </div>

                  <span className="text-xs font-bold text-rose-300 w-8 text-left shrink-0">
                    {formatTemp(dayItem.tempMax, units.temp)}
                  </span>
                </div>

                {/* Expander Icon */}
                <div className="shrink-0 text-slate-400 hover:text-slate-200">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Expanded Details Drawer */}
              {isExpanded && (
                <div className="p-4 bg-slate-900/90 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300 animate-fadeIn">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block flex items-center gap-1">
                      <Sunrise className="w-3.5 h-3.5 text-amber-300" /> Solar Cycle
                    </span>
                    <div className="font-medium text-slate-200">
                      Rise: {formatTime(dayItem.sunrise)}
                    </div>
                    <div className="font-medium text-slate-200">
                      Set: {formatTime(dayItem.sunset)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-400" /> UV Index Peak
                    </span>
                    <div className="font-bold text-amber-300">
                      UV {dayItem.uvIndexMax.toFixed(1)} ({uvInfo.label})
                    </div>
                    <p className="text-[10px] text-slate-400">{uvInfo.advice}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5 text-cyan-300" /> Max Wind Speed
                    </span>
                    <div className="font-bold text-slate-100">
                      {windMaxInfo.value} {windMaxInfo.unitLabel}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Gusts up to {convertWind(dayItem.windGustsMax, units.wind).value} {units.wind}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-blue-300" /> Total Precip
                    </span>
                    <div className="font-bold text-sky-300">
                      {precipInfo.value} {precipInfo.unitLabel} ({dayItem.precipitationProbabilityMax}%)
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Apparent High: {formatTemp(dayItem.apparentTempMax, units.temp)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
