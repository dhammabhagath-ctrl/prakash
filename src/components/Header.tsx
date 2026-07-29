import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Compass,
  Bell,
  SlidersHorizontal,
  Bookmark,
  Check,
  X,
  Sparkles,
  Loader2,
  ChevronDown,
  Wind,
} from 'lucide-react';
import { LocationItem, UnitsSettings } from '../types';
import { DEFAULT_LOCATIONS } from '../lib/weatherUtils';

interface HeaderProps {
  currentLocation: LocationItem;
  onSelectLocation: (loc: LocationItem) => void;
  units: UnitsSettings;
  onUpdateUnits: (units: UnitsSettings) => void;
  savedLocations: LocationItem[];
  onToggleSaveLocation: (loc: LocationItem) => void;
  alertCount: number;
  onOpenAlertsModal: () => void;
  onOpenAIBriefing: () => void;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  onSelectLocation,
  units,
  onUpdateUnits,
  savedLocations,
  onToggleSaveLocation,
  alertCount,
  onOpenAlertsModal,
  onOpenAIBriefing,
  loading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettingsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const resp = await fetch(`/api/weather/geocode?q=${encodeURIComponent(searchQuery.trim())}`);
        if (resp.ok) {
          const data = await resp.json();
          const items: LocationItem[] = (data.results || []).map((resItem: any) => ({
            id: `${resItem.id || resItem.latitude}-${resItem.longitude}`,
            name: resItem.name,
            latitude: resItem.latitude,
            longitude: resItem.longitude,
            country: resItem.country || '',
            country_code: resItem.country_code || '',
            admin1: resItem.admin1 || '',
            timezone: resItem.timezone || '',
            elevation: resItem.elevation || 0,
          }));
          setSearchResults(items);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error('Failed to search locations:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = (loc: LocationItem) => {
    onSelectLocation(loc);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const resp = await fetch(`/api/weather/reverse-geocode?lat=${latitude}&lon=${longitude}`);
          let name = 'Current Location';
          let country = '';
          let admin1 = '';
          if (resp.ok) {
            const data = await resp.json();
            name = data.name || name;
            country = data.country || '';
            admin1 = data.admin1 || '';
          }
          onSelectLocation({
            id: `gps-${latitude.toFixed(2)}-${longitude.toFixed(2)}`,
            name,
            latitude,
            longitude,
            country,
            admin1,
          });
        } catch {
          onSelectLocation({
            id: `gps-${latitude.toFixed(2)}-${longitude.toFixed(2)}`,
            name: 'Current GPS Location',
            latitude,
            longitude,
          });
        } finally {
          setIsGpsLoading(false);
          setShowSearchDropdown(false);
        }
      },
      (err) => {
        console.error('GPS error:', err);
        alert('Unable to acquire GPS position. Please check location permissions.');
        setIsGpsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const isCurrentSaved = savedLocations.some(
    (item) =>
      Math.abs(item.latitude - currentLocation.latitude) < 0.05 &&
      Math.abs(item.longitude - currentLocation.longitude) < 0.05
  );

  return (
    <header id="main-app-header" className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 text-slate-100 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectLocation(DEFAULT_LOCATIONS[0])}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/20 text-white">
              <Wind className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-sky-200 to-sky-400 bg-clip-text text-transparent">
                  AeroWeather
                </span>
                <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase">
                  Hyper-Local
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
                Real-Time Forecasts & Alerts Engine
              </p>
            </div>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="mobile-ai-briefing-btn"
              onClick={onOpenAIBriefing}
              className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-medium flex items-center gap-1 shadow-sm active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Brief</span>
            </button>

            <button
              id="mobile-alerts-btn"
              onClick={onOpenAlertsModal}
              className={`p-2 rounded-lg border relative transition-all ${
                alertCount > 0
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Bell className="w-4 h-4" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Center Search Input */}
        <div ref={searchRef} className="relative w-full md:max-w-md">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
            <input
              id="location-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder="Search city, district, zip, or coordinates..."
              className="w-full bg-slate-800/90 hover:bg-slate-800 focus:bg-slate-900 border border-slate-700/80 focus:border-sky-500 rounded-xl pl-9 pr-24 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all shadow-inner"
            />
            {isSearching ? (
              <Loader2 className="w-4 h-4 absolute right-16 text-sky-400 animate-spin" />
            ) : searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-16 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}

            <button
              id="gps-location-btn"
              onClick={handleUseGps}
              disabled={isGpsLoading}
              title="Use current GPS position"
              className="absolute right-1.5 px-2 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded-lg text-xs font-medium flex items-center gap-1 border border-sky-500/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {isGpsLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <MapPin className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">GPS</span>
            </button>
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
              <div className="p-2 bg-slate-950/50 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>Locations</span>
                <button
                  onClick={handleUseGps}
                  className="text-sky-400 hover:underline flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" /> Auto-detect location
                </button>
              </div>

              {searchResults.length > 0 ? (
                searchResults.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => handleSelectSearchResult(loc)}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-800 flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="text-xs md:text-sm font-medium text-slate-200 group-hover:text-sky-300 flex items-center gap-1.5">
                        <span>{loc.name}</span>
                        {loc.admin1 && (
                          <span className="text-[11px] text-slate-400 font-normal">
                            ({loc.admin1})
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {loc.country} • Lat: {loc.latitude.toFixed(2)}, Lon: {loc.longitude.toFixed(2)}
                      </div>
                    </div>
                    <Compass className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
                  </button>
                ))
              ) : searchQuery.trim().length >= 2 && !isSearching ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No matching locations found for "{searchQuery}".
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  <div className="px-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Popular Locations
                  </div>
                  {DEFAULT_LOCATIONS.slice(0, 5).map((defLoc) => (
                    <button
                      key={defLoc.id}
                      onClick={() => handleSelectSearchResult(defLoc)}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-xs text-slate-300 flex items-center justify-between"
                    >
                      <span>{defLoc.name}, {defLoc.country}</span>
                      <span className="text-[10px] text-slate-500">Preset</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Action Bar */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* AI Weather Briefing Button */}
          <button
            id="ai-briefing-modal-trigger"
            onClick={onOpenAIBriefing}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 transition-all border border-indigo-400/30"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
            <span>AI Briefing</span>
          </button>

          {/* Bookmark Location */}
          <button
            id="bookmark-location-btn"
            onClick={() => onToggleSaveLocation(currentLocation)}
            title={isCurrentSaved ? 'Remove from saved locations' : 'Save this location'}
            className={`p-2 rounded-xl border transition-all ${
              isCurrentSaved
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700/80 hover:bg-slate-700'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isCurrentSaved ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Severe Weather Alerts Bell */}
          <button
            id="alerts-modal-trigger"
            onClick={onOpenAlertsModal}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-medium transition-all relative ${
              alertCount > 0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700/80 hover:bg-slate-700'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Alerts</span>
            {alertCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-bold rounded-full">
                {alertCount}
              </span>
            )}
          </button>

          {/* Unit Settings Dropdown */}
          <div ref={settingsRef} className="relative">
            <button
              id="unit-settings-btn"
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl text-slate-300 flex items-center gap-1 transition-all"
              title="Units & Display Preferences"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-xs font-bold uppercase text-sky-400">
                °{units.temp.toUpperCase()}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showSettingsDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-3 z-50 text-xs space-y-3">
                <div className="font-semibold text-slate-200 pb-1 border-b border-slate-800 flex items-center justify-between">
                  <span>Unit Settings</span>
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Temperature */}
                <div>
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    Temperature
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl">
                    <button
                      onClick={() => onUpdateUnits({ ...units, temp: 'c' })}
                      className={`py-1 rounded-lg font-medium transition-all ${
                        units.temp === 'c'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Celsius (°C)
                    </button>
                    <button
                      onClick={() => onUpdateUnits({ ...units, temp: 'f' })}
                      className={`py-1 rounded-lg font-medium transition-all ${
                        units.temp === 'f'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Fahrenheit (°F)
                    </button>
                  </div>
                </div>

                {/* Wind Speed */}
                <div>
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    Wind Speed
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl">
                    <button
                      onClick={() => onUpdateUnits({ ...units, wind: 'kmh' })}
                      className={`py-1 rounded-lg text-[11px] font-medium transition-all ${
                        units.wind === 'kmh'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      km/h
                    </button>
                    <button
                      onClick={() => onUpdateUnits({ ...units, wind: 'mph' })}
                      className={`py-1 rounded-lg text-[11px] font-medium transition-all ${
                        units.wind === 'mph'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      mph
                    </button>
                    <button
                      onClick={() => onUpdateUnits({ ...units, wind: 'ms' })}
                      className={`py-1 rounded-lg text-[11px] font-medium transition-all ${
                        units.wind === 'ms'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      m/s
                    </button>
                  </div>
                </div>

                {/* Precipitation */}
                <div>
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    Precipitation Depth
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl">
                    <button
                      onClick={() => onUpdateUnits({ ...units, precip: 'mm' })}
                      className={`py-1 rounded-lg font-medium transition-all ${
                        units.precip === 'mm'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Millimeters (mm)
                    </button>
                    <button
                      onClick={() => onUpdateUnits({ ...units, precip: 'inch' })}
                      className={`py-1 rounded-lg font-medium transition-all ${
                        units.precip === 'inch'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Inches (in)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Locations Bar */}
      {savedLocations.length > 0 && (
        <div className="max-w-7xl mx-auto mt-2.5 pt-2 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-medium text-slate-400 shrink-0 flex items-center gap-1">
            <Bookmark className="w-3 h-3 text-amber-400" /> Saved:
          </span>
          {savedLocations.map((loc) => {
            const isActive =
              Math.abs(loc.latitude - currentLocation.latitude) < 0.02 &&
              Math.abs(loc.longitude - currentLocation.longitude) < 0.02;
            return (
              <button
                key={loc.id}
                onClick={() => onSelectLocation(loc)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                <span>{loc.name}</span>
                {isActive && <Check className="w-3 h-3 text-sky-400" />}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
