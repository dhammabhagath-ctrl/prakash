import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  Clock,
  MapPin,
  X,
  Plus,
  Trash2,
  Check,
  Bell,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { WeatherAlert, CustomAlertRule, WeatherData } from '../types';
import { formatDate, formatTime } from '../lib/weatherUtils';

interface AlertsSectionProps {
  alerts: WeatherAlert[];
  customRules: CustomAlertRule[];
  onAddRule: (rule: CustomAlertRule) => void;
  onToggleRule: (id: string) => void;
  onDeleteRule: (id: string) => void;
  weatherData: WeatherData;
  isOpenModal?: boolean;
  onCloseModal?: () => void;
}

export const AlertsSection: React.FC<AlertsSectionProps> = ({
  alerts,
  customRules,
  onAddRule,
  onToggleRule,
  onDeleteRule,
  weatherData,
  isOpenModal,
  onCloseModal,
}) => {
  const [activeTab, setActiveTab] = useState<'meteorological' | 'custom'>('meteorological');

  // New Custom Rule Form State
  const [metric, setMetric] = useState<CustomAlertRule['metric']>('rain_prob');
  const [condition, setCondition] = useState<CustomAlertRule['condition']>('gt');
  const [value, setValue] = useState<number>(70);
  const [label, setLabel] = useState<string>('High Rain Probability Alert');

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule: CustomAlertRule = {
      id: `rule-${Date.now()}`,
      metric,
      condition,
      value,
      enabled: true,
      label: label.trim() || 'Custom Weather Trigger',
    };
    onAddRule(newRule);
    setLabel('');
  };

  // Evaluate Custom Rule status against current weather data
  const evaluateCustomRule = (rule: CustomAlertRule): boolean => {
    if (!rule.enabled || !weatherData || !weatherData.current) return false;
    const { current, hourly, airQuality, daily } = weatherData;

    switch (rule.metric) {
      case 'rain_prob': {
        const peakRainProb = Math.max(...(hourly?.map((h) => h.precipProbability) || [0]));
        return rule.condition === 'gt' ? peakRainProb > rule.value : peakRainProb < rule.value;
      }
      case 'wind_speed': {
        return rule.condition === 'gt'
          ? current.windSpeed > rule.value || current.windGusts > rule.value
          : current.windSpeed < rule.value;
      }
      case 'temp_low': {
        return rule.condition === 'lt' ? current.temperature < rule.value : current.temperature > rule.value;
      }
      case 'temp_high': {
        return rule.condition === 'gt' ? current.temperature > rule.value : current.temperature < rule.value;
      }
      case 'uv_index': {
        const uvMax = daily[0]?.uvIndexMax || 0;
        return rule.condition === 'gt' ? uvMax > rule.value : uvMax < rule.value;
      }
      case 'aqi': {
        const aqi = airQuality?.usAqi || 0;
        return rule.condition === 'gt' ? aqi > rule.value : aqi < rule.value;
      }
      default:
        return false;
    }
  };

  const contentMarkup = (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('meteorological')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'meteorological'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Active Weather Warnings ({alerts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('custom')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'custom'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Custom Trigger Rules ({customRules.length})</span>
        </button>
      </div>

      {activeTab === 'meteorological' ? (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
              <ShieldAlert className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
              <p className="text-sm font-semibold text-slate-200">
                No Active Weather Warnings
              </p>
              <p className="text-xs">
                All hyper-local meteorological parameters for {weatherData.location.name} are within normal thresholds.
              </p>
            </div>
          ) : (
            alerts.map((alertItem) => {
              const isCritical = alertItem.severity === 'critical';
              const isWarning = alertItem.severity === 'warning';

              return (
                <div
                  key={alertItem.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCritical
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-100 shadow-lg shadow-rose-950/50'
                      : isWarning
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-100 shadow-lg shadow-amber-950/50'
                      : 'bg-sky-950/40 border-sky-500/50 text-sky-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          isCritical
                            ? 'bg-rose-500 text-white'
                            : isWarning
                            ? 'bg-amber-500 text-white'
                            : 'bg-sky-500 text-white'
                        }`}
                      >
                        {isCritical ? (
                          <ShieldAlert className="w-5 h-5 animate-pulse" />
                        ) : (
                          <AlertTriangle className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isCritical
                                ? 'bg-rose-500/30 text-rose-300 border border-rose-400/30'
                                : isWarning
                                ? 'bg-amber-500/30 text-amber-300 border border-amber-400/30'
                                : 'bg-sky-500/30 text-sky-300 border border-sky-400/30'
                            }`}
                          >
                            {alertItem.severity}
                          </span>
                          <span className="text-xs font-bold text-slate-200">
                            {alertItem.event}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-white mt-1">
                          {alertItem.title}
                        </h3>

                        <p className="text-xs opacity-90 mt-1 leading-relaxed">
                          {alertItem.description}
                        </p>

                        <div className="mt-2.5 p-3 rounded-xl bg-black/30 border border-white/10 text-xs font-medium space-y-1">
                          <div className="font-semibold text-amber-300 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5" /> Safety Instruction:
                          </div>
                          <p className="text-slate-200">{alertItem.instruction}</p>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-300/80 font-mono">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" /> {alertItem.area}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> Effective:{' '}
                            {formatTime(alertItem.effective)}
                          </span>
                          {alertItem.metricTriggered && (
                            <span className="px-1.5 py-0.5 bg-white/10 rounded text-slate-200">
                              Trigger: {alertItem.metricTriggered}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Custom Trigger Rules Tab */
        <div className="space-y-6">
          {/* Create Rule Form */}
          <form
            onSubmit={handleCreateRule}
            className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3"
          >
            <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sky-400">
                <Plus className="w-4 h-4" /> Add Custom Alert Trigger
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                Notifies when weather condition crosses target
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {/* Metric Select */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-medium">Metric</label>
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="rain_prob">Rain Probability (%)</option>
                  <option value="wind_speed">Wind Speed (km/h)</option>
                  <option value="temp_low">Low Temp Threshold (°C)</option>
                  <option value="temp_high">High Temp Threshold (°C)</option>
                  <option value="uv_index">UV Index Max</option>
                  <option value="aqi">US Air Quality (AQI)</option>
                </select>
              </div>

              {/* Condition Select */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-medium">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="gt">Greater Than (&gt;)</option>
                  <option value="lt">Less Than (&lt;)</option>
                </select>
              </div>

              {/* Value Input */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-medium">Target Value</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Custom Label */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-medium">Rule Label</label>
                <input
                  type="text"
                  placeholder="e.g. Heavy Rain Alert"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Save Trigger Rule
            </button>
          </form>

          {/* List of Custom Rules */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Your Active Alert Triggers
            </h4>
            {customRules.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No custom rules set yet.</p>
            ) : (
              customRules.map((rule) => {
                const isTriggered = evaluateCustomRule(rule);
                return (
                  <div
                    key={rule.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      isTriggered
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-md animate-pulse'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleRule(rule.id)}
                        className={`w-8 h-5 rounded-full p-0.5 transition-colors ${
                          rule.enabled ? 'bg-sky-500' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            rule.enabled ? 'translate-x-3' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <div>
                        <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                          <span>{rule.label}</span>
                          {isTriggered && (
                            <span className="px-2 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold uppercase">
                              Triggered Now!
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          Trigger when metric is {rule.condition === 'gt' ? '>' : '<'} {rule.value}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteRule(rule.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (isOpenModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
        <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-amber-400 animate-pulse" />
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  Real-Time Weather Warning Center
                </h2>
                <p className="text-xs text-slate-400">
                  {weatherData.location.name} • Live Meteorological Sensors
                </p>
              </div>
            </div>
            {onCloseModal && (
              <button
                onClick={onCloseModal}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-6 overflow-y-auto">{contentMarkup}</div>
        </div>
      </div>
    );
  }

  return (
    <div id="inline-alerts-container" className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" /> Real-Time Weather Alert Center
        </h2>
      </div>
      {contentMarkup}
    </div>
  );
};
