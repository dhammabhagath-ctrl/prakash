import React from 'react';
import { getWeatherCodeInfo } from '../lib/weatherCodes';

interface WeatherBackgroundProps {
  weatherCode: number;
  isDay: boolean;
}

export const WeatherBackground: React.FC<WeatherBackgroundProps> = ({
  weatherCode,
  isDay,
}) => {
  const codeInfo = getWeatherCodeInfo(weatherCode);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* 1. Base Gradient Overlay */}
      <div
        className={`absolute inset-0 bg-slate-950 transition-colors duration-1000`}
      />

      {/* 2. Soft Atmospheric Ambient Radial Glow */}
      {isDay && codeInfo.category === 'clear' && (
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-[120px] animate-pulse" />
      )}

      {codeInfo.category === 'rain' && (
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-blue-600/10 blur-[140px]" />
      )}

      {codeInfo.category === 'thunderstorm' && (
        <div className="absolute inset-0 bg-purple-900/10 animate-pulse transition-opacity duration-300" />
      )}

      {codeInfo.category === 'snow' && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-sky-300/10 blur-[120px]" />
      )}

      {/* Subtle Noise Texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
    </div>
  );
};
