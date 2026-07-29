import React, { useState, useEffect } from 'react';
import {
  WeatherData,
  LocationItem,
  UnitsSettings,
  CustomAlertRule,
} from './types';
import { DEFAULT_LOCATIONS } from './lib/weatherUtils';
import { Header } from './components/Header';
import { CurrentWeatherCard } from './components/CurrentWeatherCard';
import { HourlyForecast } from './components/HourlyForecast';
import { DailyForecast } from './components/DailyForecast';
import { WeatherRadarMap } from './components/WeatherRadarMap';
import { AtmosphericMetricsGrid } from './components/AtmosphericMetricsGrid';
import { AlertsSection } from './components/AlertsSection';
import { AIBriefingModal } from './components/AIBriefingModal';
import { WeatherBackground } from './components/WeatherBackground';
import { Loader2, RefreshCw, AlertCircle, Sparkles, MapPin } from 'lucide-react';

export default function App() {
  // 1. Units State
  const [units, setUnits] = useState<UnitsSettings>(() => {
    try {
      const saved = localStorage.getItem('aeroweather_units');
      return saved ? JSON.parse(saved) : { temp: 'c', wind: 'kmh', precip: 'mm', pressure: 'hpa' };
    } catch {
      return { temp: 'c', wind: 'kmh', precip: 'mm', pressure: 'hpa' };
    }
  });

  // Save Units
  useEffect(() => {
    try {
      localStorage.setItem('aeroweather_units', JSON.stringify(units));
    } catch (e) {
      console.error('Failed to save units:', e);
    }
  }, [units]);

  // 2. Saved Locations State
  const [savedLocations, setSavedLocations] = useState<LocationItem[]>(() => {
    try {
      const saved = localStorage.getItem('aeroweather_saved_locations');
      return saved ? JSON.parse(saved) : DEFAULT_LOCATIONS.slice(0, 4);
    } catch {
      return DEFAULT_LOCATIONS.slice(0, 4);
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('aeroweather_saved_locations', JSON.stringify(savedLocations));
    } catch (e) {
      console.error('Failed to save locations:', e);
    }
  }, [savedLocations]);

  // 3. Custom Alert Rules State
  const [customRules, setCustomRules] = useState<CustomAlertRule[]>(() => {
    try {
      const saved = localStorage.getItem('aeroweather_custom_rules');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'rule-rain',
              label: 'High Rain Probability (>70%)',
              metric: 'rain_prob',
              condition: 'gt',
              value: 70,
              enabled: true,
            },
            {
              id: 'rule-wind',
              label: 'Strong Wind Gusts (>40 km/h)',
              metric: 'wind_speed',
              condition: 'gt',
              value: 40,
              enabled: true,
            },
          ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('aeroweather_custom_rules', JSON.stringify(customRules));
    } catch (e) {
      console.error('Failed to save custom rules:', e);
    }
  }, [customRules]);

  // 4. Current Location & Weather Data
  const [currentLocation, setCurrentLocation] = useState<LocationItem>(
    DEFAULT_LOCATIONS[0]
  );
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isAIBriefingOpen, setIsAIBriefingOpen] = useState<boolean>(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);

  // Fetch Live Weather Data from Express Server
  const fetchWeatherData = async (loc: LocationItem) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        lat: loc.latitude.toString(),
        lon: loc.longitude.toString(),
        name: loc.name,
        country: loc.country || '',
        admin1: loc.admin1 || '',
      });

      const resp = await fetch(`/api/weather/data?${params.toString()}`);
      if (!resp.ok) {
        throw new Error(`Server status ${resp.status}`);
      }
      const data: WeatherData = await resp.json();
      setWeatherData(data);
    } catch (err: any) {
      console.error('Failed to load weather data:', err);
      setError('Unable to fetch hyper-local weather data. Please check your network connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData(currentLocation);
  }, [currentLocation.latitude, currentLocation.longitude, currentLocation.name]);

  // Handlers for Location selection & bookmarking
  const handleSelectLocation = (loc: LocationItem) => {
    setCurrentLocation(loc);
  };

  const handleToggleSaveLocation = (loc: LocationItem) => {
    setSavedLocations((prev) => {
      const exists = prev.some(
        (item) =>
          Math.abs(item.latitude - loc.latitude) < 0.05 &&
          Math.abs(item.longitude - loc.longitude) < 0.05
      );
      if (exists) {
        return prev.filter(
          (item) =>
            !(
              Math.abs(item.latitude - loc.latitude) < 0.05 &&
              Math.abs(item.longitude - loc.longitude) < 0.05
            )
        );
      }
      return [loc, ...prev];
    });
  };

  // Custom Rules Handlers
  const handleAddRule = (newRule: CustomAlertRule) => {
    setCustomRules((prev) => [newRule, ...prev]);
  };

  const handleToggleRule = (id: string) => {
    setCustomRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleDeleteRule = (id: string) => {
    setCustomRules((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div id="aeroweather-root-app" className="min-h-screen bg-slate-950 text-slate-100 relative font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* Background Weather Atmosphere */}
      {weatherData && (
        <WeatherBackground
          weatherCode={weatherData.current.weatherCode}
          isDay={weatherData.current.isDay}
        />
      )}

      {/* Main Header */}
      <Header
        currentLocation={currentLocation}
        onSelectLocation={handleSelectLocation}
        units={units}
        onUpdateUnits={setUnits}
        savedLocations={savedLocations}
        onToggleSaveLocation={handleToggleSaveLocation}
        alertCount={weatherData?.alerts?.length || 0}
        onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
        onOpenAIBriefing={() => setIsAIBriefingOpen(true)}
        loading={loading}
      />

      {/* Main Content Layout */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {loading && !weatherData ? (
          /* Loading Skeleton */
          <div className="py-24 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-sky-500/20 border-2 border-sky-400 border-t-transparent animate-spin flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-200">
                Acquiring Hyper-Local Weather Stream for {currentLocation.name}...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Connecting to Doppler radars, atmospheric satellites, and microclimate sensors.
              </p>
            </div>
          </div>
        ) : error && !weatherData ? (
          /* Error State */
          <div className="p-8 rounded-3xl bg-rose-950/40 border border-rose-500/40 text-center space-y-4 max-w-xl mx-auto my-12">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h2 className="text-lg font-bold text-slate-100">
              Weather Stream Connection Error
            </h2>
            <p className="text-xs text-rose-200 leading-relaxed">{error}</p>
            <button
              onClick={() => fetchWeatherData(currentLocation)}
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl text-xs flex items-center gap-2 mx-auto transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Retry Weather Stream
            </button>
          </div>
        ) : weatherData ? (
          <>
            {/* Hero Current Conditions */}
            <CurrentWeatherCard
              weatherData={weatherData}
              units={units}
              onOpenAIBriefing={() => setIsAIBriefingOpen(true)}
              onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
            />

            {/* 24-Hour Timeline & 7-Day Grid Side-by-Side or Stacked */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-6">
                <HourlyForecast hourly={weatherData.hourly} units={units} />
                <WeatherRadarMap location={weatherData.location} weatherData={weatherData} />
              </div>

              <div className="lg:col-span-5 space-y-6">
                <DailyForecast daily={weatherData.daily} units={units} />
              </div>
            </div>

            {/* Microclimate & Atmospheric Metrics Bento Grid */}
            <section id="atmospheric-metrics-section">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Microclimate & Solar Metrics
                </h2>
                <span className="text-[11px] text-slate-500 font-mono">
                  {weatherData.location.name} Station
                </span>
              </div>
              <AtmosphericMetricsGrid weatherData={weatherData} units={units} />
            </section>

            {/* Active Severe Weather Alert Center */}
            <AlertsSection
              alerts={weatherData.alerts || []}
              customRules={customRules}
              onAddRule={handleAddRule}
              onToggleRule={handleToggleRule}
              onDeleteRule={handleDeleteRule}
              weatherData={weatherData}
            />

            {/* Modals */}
            <AIBriefingModal
              isOpen={isAIBriefingOpen}
              onClose={() => setIsAIBriefingOpen(false)}
              weatherData={weatherData}
            />

            <AlertsSection
              alerts={weatherData.alerts || []}
              customRules={customRules}
              onAddRule={handleAddRule}
              onToggleRule={handleToggleRule}
              onDeleteRule={handleDeleteRule}
              weatherData={weatherData}
              isOpenModal={isAlertsModalOpen}
              onCloseModal={() => setIsAlertsModalOpen(false)}
            />
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer id="aeroweather-footer" className="relative z-10 border-t border-slate-800/80 bg-slate-950 py-6 px-4 lg:px-8 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">AeroWeather Engine</span>
            <span>•</span>
            <span>Live Open-Meteo & Gemini AI Forecasts</span>
          </div>
          <p className="text-[11px]">
            Real-time hyper-local forecasts • Severe weather warning automation • © 2026 AeroWeather
          </p>
        </div>
      </footer>
    </div>
  );
}
