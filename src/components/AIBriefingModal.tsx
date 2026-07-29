import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Loader2,
  Shirt,
  Compass,
  Activity,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lightbulb,
} from 'lucide-react';
import { WeatherData, GeminiAIBriefing } from '../types';

interface AIBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  weatherData: WeatherData;
}

export const AIBriefingModal: React.FC<AIBriefingModalProps> = ({
  isOpen,
  onClose,
  weatherData,
}) => {
  const [briefing, setBriefing] = useState<GeminiAIBriefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAIBriefing = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/weather/ai-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weatherData }),
      });
      if (!resp.ok) {
        throw new Error('Server returned an error generating AI briefing.');
      }
      const data = await resp.json();
      setBriefing(data);
    } catch (err: any) {
      console.error('Failed to fetch AI briefing:', err);
      setError('Could not connect to AI Weather Intelligence service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !briefing && !loading) {
      fetchAIBriefing();
    }
  }, [isOpen, weatherData.location.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-md">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Hyper-Local AI Weather Briefing
              </h2>
              <p className="text-xs text-slate-400">
                Powered by Gemini 3.6 • {weatherData.location.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAIBriefing}
              disabled={loading}
              title="Refresh AI Briefing"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full border-2 border-indigo-500 border-t-transparent animate-spin flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Synthesizing Hyper-Local Atmospheric Data...
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Analyzing microclimate gradients, humidity indices, and severe thresholds.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center space-y-3">
              <p>{error}</p>
              <button
                onClick={fetchAIBriefing}
                className="px-4 py-2 bg-rose-500 text-white font-medium rounded-xl text-xs hover:bg-rose-600 transition-all"
              >
                Retry AI Generation
              </button>
            </div>
          ) : briefing ? (
            <>
              {/* Executive Summary */}
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
                <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-300" />
                  Executive Weather Briefing
                </div>
                <p className="text-sm leading-relaxed text-slate-200 font-medium">
                  {briefing.summary}
                </p>
              </div>

              {/* Microclimate Analysis */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-sky-400" />
                  Microclimate Dynamics & Atmospheric Dynamics
                </h3>
                <p className="text-xs leading-relaxed text-slate-300 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
                  {briefing.microclimateAnalysis}
                </p>
              </div>

              {/* Clothing & Gear Recommendations */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shirt className="w-4 h-4 text-purple-400" />
                  Smart Clothing & Gear Advisory
                </h3>
                <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-xs leading-relaxed text-purple-200">
                  {briefing.clothingAdvice}
                </div>
              </div>

              {/* Outdoor Activities Feasibility */}
              {briefing.activities && briefing.activities.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Activity & Outdoor Suitability
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {briefing.activities.map((act, idx) => {
                      const isOptimal = act.status === 'optimal';
                      const isCaution = act.status === 'caution';
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-2xl border flex items-start gap-2.5 text-xs transition-all ${
                            isOptimal
                              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                              : isCaution
                              ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                              : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                          }`}
                        >
                          {isOptimal ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : isCaution ? (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="font-semibold text-slate-100 flex items-center justify-between">
                              <span>{act.name}</span>
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-black/30">
                                {act.status}
                              </span>
                            </div>
                            <p className="text-[11px] opacity-80 mt-1">{act.note}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Alert Safety Advice */}
              {briefing.alertAdvice && (
                <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <ShieldAlert className="w-4 h-4" /> Safety Protocol Advice
                  </div>
                  <p>{briefing.alertAdvice}</p>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>AeroWeather Gemini Intelligence Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
