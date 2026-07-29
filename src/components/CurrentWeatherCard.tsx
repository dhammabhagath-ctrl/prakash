import React from 'react';
import {
  Sun,
  SunDim,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  Snowflake,
  CloudSunRain,
  CloudLightning,
  CloudHail,
  Wind,
  Droplets,
  Thermometer,
  Gauge,
  Eye,
  Sparkles,
  Compass,
  ArrowUp,
  ArrowDown,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { WeatherData, UnitsSettings } from '../types';
import { getWeatherCodeInfo } from '../lib/weatherCodes';
import {
  formatTemp,
  convertWind,
  convertPressure,
  getWindCardinal,
  formatTime,
  getAqiInfo,
  getUvInfo,
} from '../lib/weatherUtils';

interface CurrentWeatherCardProps {
  weatherData: WeatherData;
  units: UnitsSettings;
  onOpenAIBriefing: () => void;
  onOpenAlertsModal: () => void;
}

export const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({
  weatherData,
  units,
  onOpenAIBriefing,
  onOpenAlertsModal,
}) => {
  const { location, current, daily, airQuality, alerts, updatedAt } = weatherData;

  const codeInfo = getWeatherCodeInfo(current.weatherCode);
  const todayDaily = daily[0] || {};
  const windInfo = convertWind(current.windSpeed, units.wind);
  const gustInfo = convertWind(current.windGusts, units.wind);
  const pressureInfo = convertPressure(current.pressureMsl, units.pressure);
  const aqiInfo = getAqiInfo(airQuality.usAqi);
  const uvInfo = getUvInfo(todayDaily.uvIndexMax || 0);

  // Dynamic Weather Icon Mapper
  const renderWeatherIcon = (iconName: string, className = 'w-16 h-16') => {
    switch (iconName) {
      case 'Sun':
        return <Sun className={`${className} text-amber-400 animate-spin-slow`} />;
      case 'SunDim':
        return <SunDim className={`${className} text-amber-300`} />;
      case 'CloudSun':
        return <CloudSun className={`${className} text-sky-300`} />;
      case 'CloudFog':
        return <CloudFog className={`${className} text-slate-300`} />;
      case 'CloudDrizzle':
        return <CloudDrizzle className={`${className} text-sky-400`} />;
      case 'CloudRain':
        return <CloudRain className={`${className} text-blue-400`} />;
      case 'CloudRainWind':
        return <CloudRainWind className={`${className} text-indigo-400`} />;
      case 'CloudSnow':
        return <CloudSnow className={`${className} text-sky-200`} />;
      case 'Snowflake':
        return <Snowflake className={`${className} text-white animate-pulse`} />;
      case 'CloudSunRain':
        return <CloudSunRain className={`${className} text-amber-300`} />;
      case 'CloudLightning':
        return <CloudLightning className={`${className} text-amber-400 animate-pulse`} />;
      case 'CloudHail':
        return <CloudHail className={`${className} text-sky-200`} />;
      default:
        return <Cloud className={`${className} text-slate-300`} />;
    }
  };

  const isNight = !current.isDay;
  const cardGradient = isNight
    ? 'from-slate-900 via-indigo-950 to-slate-950'
    : codeInfo.bgGradientDay;

  return (
    <div
      id="current-weather-hero-card"
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${cardGradient} p-6 md:p-8 text-white shadow-2xl border border-white/10 transition-all duration-500`}
    >
      {/* Background Overlay Glows */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-black/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Meta Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-white/15">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {location.name}
            </h1>
            {location.admin1 && (
              <span className="text-sm font-medium opacity-80">
                , {location.admin1}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md font-medium border border-white/20">
              {location.country}
            </span>
          </div>
          <p className="text-xs opacity-75 mt-1 flex items-center gap-1.5 font-mono">
            <span>Lat: {location.latitude.toFixed(2)}°</span> •{' '}
            <span>Lon: {location.longitude.toFixed(2)}°</span> •{' '}
            <Clock className="w-3 h-3 text-sky-300" />
            <span>Updated {formatTime(updatedAt)}</span>
          </p>
        </div>

        {/* AI Briefing Button & Active Alerts */}
        <div className="flex items-center gap-2">
          {alerts && alerts.length > 0 && (
            <button
              onClick={onOpenAlertsModal}
              className="px-3 py-1.5 rounded-xl bg-red-500/30 hover:bg-red-500/40 border border-red-400/50 text-red-200 text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-md animate-pulse"
            >
              <ShieldAlert className="w-4 h-4 text-red-300" />
              <span>{alerts.length} Active Alert{alerts.length > 1 ? 's' : ''}</span>
            </button>
          )}

          <button
            id="hero-ai-briefing-btn"
            onClick={onOpenAIBriefing}
            className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI Hyper-Local Briefing</span>
          </button>
        </div>
      </div>

      {/* Main Temperature & Condition Layout */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-6">
        {/* Big Temperature Display */}
        <div className="md:col-span-7 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="shrink-0 p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/15">
            {renderWeatherIcon(codeInfo.iconName, 'w-20 h-20 md:w-24 md:h-24')}
          </div>

          <div className="text-center sm:text-left">
            <div className="flex items-baseline justify-center sm:justify-start gap-1">
              <span className="text-6xl md:text-7xl font-black tracking-tighter leading-none">
                {formatTemp(current.temperature, units.temp).replace(/°[CF]/, '')}
              </span>
              <span className="text-3xl font-light text-white/80">
                °{units.temp.toUpperCase()}
              </span>
            </div>

            <div className="text-lg md:text-xl font-bold tracking-wide mt-2">
              {codeInfo.label}
            </div>

            <div className="text-xs md:text-sm opacity-90 mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <span>
                Feels like{' '}
                <strong className="font-semibold">
                  {formatTemp(current.apparentTemperature, units.temp)}
                </strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ArrowUp className="w-3.5 h-3.5 text-rose-300 inline" />
                {formatTemp(todayDaily.tempMax || current.temperature, units.temp)}
                <ArrowDown className="w-3.5 h-3.5 text-sky-300 inline ml-1" />
                {formatTemp(todayDaily.tempMin || current.temperature, units.temp)}
              </span>
            </div>
          </div>
        </div>

        {/* Highlight Quick Stats Column */}
        <div className="md:col-span-5 grid grid-cols-2 gap-3">
          {/* Air Quality Quick Box */}
          <div className="p-3.5 rounded-2xl bg-black/25 backdrop-blur-md border border-white/10">
            <div className="text-[11px] font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-sky-300" />
              Air Quality
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold">{airQuality.usAqi}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${aqiInfo.bgColor}`}>
                {aqiInfo.label}
              </span>
            </div>
            <p className="text-[10px] text-white/70 mt-1 truncate">
              PM2.5: {airQuality.pm25} µg/m³
            </p>
          </div>

          {/* UV Index Quick Box */}
          <div className="p-3.5 rounded-2xl bg-black/25 backdrop-blur-md border border-white/10">
            <div className="text-[11px] font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              UV Index Max
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {todayDaily.uvIndexMax ? todayDaily.uvIndexMax.toFixed(1) : '0.0'}
              </span>
              <span className={`text-xs font-semibold ${uvInfo.color}`}>
                {uvInfo.label}
              </span>
            </div>
            <p className="text-[10px] text-white/70 mt-1 truncate">
              {uvInfo.advice}
            </p>
          </div>

          {/* Wind & Gusts Box */}
          <div className="p-3.5 rounded-2xl bg-black/25 backdrop-blur-md border border-white/10">
            <div className="text-[11px] font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-cyan-300" />
              Wind Vector
            </div>
            <div className="mt-2 text-lg font-bold flex items-center gap-1">
              <span>
                {windInfo.value} {windInfo.unitLabel}
              </span>
              <span className="text-xs font-normal opacity-80">
                ({getWindCardinal(current.windDirection)})
              </span>
            </div>
            <p className="text-[10px] text-white/70 mt-1">
              Gusts up to {gustInfo.value} {gustInfo.unitLabel}
            </p>
          </div>

          {/* Humidity & Dew Point Box */}
          <div className="p-3.5 rounded-2xl bg-black/25 backdrop-blur-md border border-white/10">
            <div className="text-[11px] font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-blue-300" />
              Humidity
            </div>
            <div className="mt-2 text-2xl font-bold">
              {current.relativeHumidity}%
            </div>
            <p className="text-[10px] text-white/70 mt-1">
              Pressure: {pressureInfo.value} {pressureInfo.unitLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
