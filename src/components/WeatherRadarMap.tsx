import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Layers,
  MapPin,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Wind,
  CloudRain,
  Eye,
  Activity,
  Compass,
} from 'lucide-react';
import { LocationItem, WeatherData } from '../types';

interface WeatherRadarMapProps {
  location: LocationItem;
  weatherData: WeatherData;
}

export const WeatherRadarMap: React.FC<WeatherRadarMapProps> = ({
  location,
  weatherData,
}) => {
  const [activeLayer, setActiveLayer] = useState<'radar' | 'clouds' | 'wind' | 'pressure'>('radar');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [radarTimeOffset, setRadarTimeOffset] = useState<number>(0); // 0 = now, -3 = -30min, +3 = +30min
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Canvas Radar Loop Simulator
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    // Particle seeds for wind/rain
    const particleCount = activeLayer === 'wind' ? 120 : 60;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.2) * (weatherData.current.windSpeed / 10 + 1),
      vy: Math.random() * 2 + 1,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.7 + 0.3,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Map Grid Background & Station Dot
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 1;
      const step = 40 * zoomLevel;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // 2. Draw Active Layer Renderings
      if (activeLayer === 'radar') {
        // Radar Sweep Circle
        const sweepAngle = (frameCount * 0.03 * speed) % (Math.PI * 2);
        const radius = Math.min(canvas.width, canvas.height) * 0.42 * zoomLevel;

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Sweep cone
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, sweepAngle - 0.4, sweepAngle);
        ctx.closePath();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.fill();
        ctx.restore();

        // Simulated Rain Radar Clusters
        const clusters = [
          { x: centerX - 60 * zoomLevel, y: centerY - 40 * zoomLevel, r: 45 * zoomLevel, intensity: 'high' },
          { x: centerX + 70 * zoomLevel, y: centerY + 50 * zoomLevel, r: 60 * zoomLevel, intensity: 'medium' },
          { x: centerX - 90 * zoomLevel, y: centerY + 80 * zoomLevel, r: 35 * zoomLevel, intensity: 'light' },
        ];

        clusters.forEach((c) => {
          const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
          if (c.intensity === 'high') {
            grad.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
            grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.5)');
            grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          } else if (c.intensity === 'medium') {
            grad.addColorStop(0, 'rgba(245, 158, 11, 0.6)');
            grad.addColorStop(0.6, 'rgba(56, 189, 248, 0.4)');
            grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          } else {
            grad.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
            grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          }
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        });
      } else if (activeLayer === 'clouds') {
        // Satellite Cloud Cover Layer
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.arc(centerX - 30, centerY - 20, 110 * zoomLevel, 0, Math.PI * 2);
        ctx.arc(centerX + 80, centerY + 30, 140 * zoomLevel, 0, Math.PI * 2);
        ctx.fill();
      } else if (activeLayer === 'wind') {
        // Wind Vector Streamlines
        particles.forEach((p) => {
          ctx.strokeStyle = `rgba(56, 189, 248, ${p.opacity})`;
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 6, p.y + p.vy * 4);
          ctx.stroke();

          if (isPlaying) {
            p.x += p.vx * speed;
            p.y += p.vy * speed;
            if (p.x > canvas.width) p.x = 0;
            if (p.y > canvas.height) p.y = 0;
          }
        });
      } else if (activeLayer === 'pressure') {
        // Isobar Surface Pressure Heatmap
        const isoGrad = ctx.createRadialGradient(
          centerX,
          centerY,
          20,
          centerX,
          centerY,
          180 * zoomLevel
        );
        isoGrad.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
        isoGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.3)');
        isoGrad.addColorStop(1, 'rgba(16, 185, 129, 0.1)');

        ctx.fillStyle = isoGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 180 * zoomLevel, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Draw Station Location Pin
      ctx.beginPath();
      ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Pulse ring around pin
      const pulseR = 8 + (frameCount % 40) * 0.4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(56, 189, 248, ${1 - (frameCount % 40) / 40})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (isPlaying) {
        frameCount++;
      }
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [activeLayer, isPlaying, speed, zoomLevel, weatherData]);

  // Adjust timeline slider (-60m to +60m)
  const timeLabels = ['-60m', '-45m', '-30m', '-15m', 'LIVE', '+15m', '+30m', '+45m', '+60m'];

  return (
    <div id="hyperlocal-radar-container" className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-sky-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Hyper-Local Doppler Radar & Map
          </h2>
        </div>

        {/* Layer Toggle Pills */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveLayer('radar')}
            className={`px-3 py-1 rounded-xl font-semibold flex items-center gap-1 transition-all ${
              activeLayer === 'radar'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Radar</span>
          </button>

          <button
            onClick={() => setActiveLayer('clouds')}
            className={`px-3 py-1 rounded-xl font-semibold flex items-center gap-1 transition-all ${
              activeLayer === 'clouds'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Clouds</span>
          </button>

          <button
            onClick={() => setActiveLayer('wind')}
            className={`px-3 py-1 rounded-xl font-semibold flex items-center gap-1 transition-all ${
              activeLayer === 'wind'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind Stream</span>
          </button>

          <button
            onClick={() => setActiveLayer('pressure')}
            className={`px-3 py-1 rounded-xl font-semibold flex items-center gap-1 transition-all ${
              activeLayer === 'pressure'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Isobar</span>
          </button>
        </div>
      </div>

      {/* Interactive Map Stage */}
      <div className="relative w-full h-80 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
        {/* Canvas Radar Rendering */}
        <canvas
          ref={canvasRef}
          width={600}
          height={320}
          className="w-full h-full object-cover"
        />

        {/* Station Overlay Label */}
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-xs text-slate-200 font-mono flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-sky-400" />
          <span>
            {location.name} Station ({location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°)
          </span>
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 px-3 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-[10px] text-slate-300 font-mono space-y-1">
          <div className="font-bold text-slate-200 flex items-center justify-between gap-2">
            <span>Precipitation Intensity</span>
            <span className="text-sky-400 font-normal">dBZ Radar</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Light</span>
            <div className="w-24 h-2 rounded bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500" />
            <span className="text-rose-400 font-bold">Heavy</span>
          </div>
        </div>

        {/* Map Zoom Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.0))}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-700/80 backdrop-blur-md shadow-md"
            title="Zoom In Map"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-700/80 backdrop-blur-md shadow-md"
            title="Zoom Out Map"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Radar Timeline & Player Control Toolbar */}
      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Play Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold transition-all shadow-md active:scale-95"
            title={isPlaying ? 'Pause radar loop' : 'Play radar loop'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          {/* Speed selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl text-xs font-mono">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  speed === s ? 'bg-slate-800 text-sky-400 font-bold' : 'text-slate-400'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Offset Slider */}
        <div className="flex-1 max-w-md w-full flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-mono font-bold shrink-0">
            {timeLabels[radarTimeOffset + 4]}
          </span>
          <input
            type="range"
            min={-4}
            max={4}
            step={1}
            value={radarTimeOffset}
            onChange={(e) => setRadarTimeOffset(parseInt(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
