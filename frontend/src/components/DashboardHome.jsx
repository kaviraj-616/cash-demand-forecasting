import React, { useState, useEffect } from 'react';
import { API_BASE_URL, apiFetch } from '../config';
import { 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Truck, 
  Activity, 
  ArrowUpRight, 
  Clock, 
  Layers,
  ChevronRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function DashboardHome({ setActiveTab }) {
  const [summary, setSummary] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [priorityATMs, setPriorityATMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, chartRes, rankRes] = await Promise.all([
        apiFetch(`${API_BASE_URL}/api/dashboard-summary`),
        apiFetch(`${API_BASE_URL}/api/forecast-chart?limit=20`),
        apiFetch(`${API_BASE_URL}/api/atm-rankings?limit=5`)
      ]);

      if (!sumRes.ok || !chartRes.ok || !rankRes.ok) {
        throw new Error("Unable to fetch data from backend API. Ensure FastAPI is running on port 8000.");
      }

      const sumData = await sumRes.json();
      const chartData = await chartRes.json();
      const rankData = await rankRes.json();

      setSummary(sumData);
      setForecastData(chartData);
      setPriorityATMs(rankData);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Loading ATM Intelligence Telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/40 border border-red-800/80 rounded-2xl p-8 max-w-2xl mx-auto my-12 text-center">
        <div className="w-14 h-14 bg-red-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-700">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-red-200 mb-2">Backend Service Connection Error</h3>
        <p className="text-gray-700 text-sm mb-6">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-gray-900 font-semibold rounded-xl transition duration-200 shadow-lg shadow-red-900/40 cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8  relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> PBL Real-Time ML Engine
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              ATM Cash Demand Forecasting & Smart Dispatch Engine
            </h1>
            <p className="text-gray-700 text-sm md:text-base max-w-2xl leading-relaxed">
              Predicting daily cash demand, detecting stockout risk probabilities with recall-prioritized classifiers, and computing dynamic replenishment routes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('simulator')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-gray-900 text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Activity className="w-4 h-4" /> Simulate Scenario
            </button>
            <button
              onClick={() => setActiveTab('dispatch')}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-800 text-sm font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <Truck className="w-4 h-4" /> Dispatch Center
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Monitored ATMs</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-gray-900">{summary?.total_atms ?? '—'}</div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-blue-400">
              <span>Active network terminals</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-red-900/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">High Outage Risks</span>
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-500/20 flex items-center justify-center text-red-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-red-600">{summary?.high_risk_atms ?? '—'}</div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600/90 font-medium">
              <span>Urgent replenishment required</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-emerald-900/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Forecast Demand</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-gray-900">₹{summary?.avg_pred_demand?.toLocaleString() ?? '—'}</div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-600">
              <span>Next 24h expected outflow</span>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-amber-900/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cash Refill</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-gray-900">₹{summary?.total_refill?.toLocaleString() ?? '—'}</div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-600">
              <span>Dynamic safety buffer included</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Priority Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Forecast Trend Preview (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Chronological Demand Forecast & Verification</h3>
                <p className="text-xs text-gray-500">Actual vs. Predicted Cash Demand across unseen test dataset observations</p>
              </div>
              <button 
                onClick={() => setActiveTab('forecasting')}
                className="text-xs text-blue-400 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                Full Analytics <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', color: '#111827', borderColor: '#E2E8F0', borderRadius: '0.75rem', fontSize: '12px' }}
                    formatter={(val) => [`₹${Number(val).toLocaleString()}`, '']}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', color: '#475569' }} />
                  <Area type="monotone" dataKey="actual" name="Actual Demand (₹)" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#actualGrad)" />
                  <Area type="monotone" dataKey="predicted" name="Predicted Demand (₹)" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#predGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-gray-200 text-center">
            <div className="bg-gray-50 rounded-xl p-3">
              <span className="text-xs text-gray-500">Target Variable</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">Cash Demand Next Day</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <span className="text-xs text-gray-500">Ensemble R² Score</span>
              <p className="text-sm font-semibold text-emerald-600 mt-0.5">0.8505 (~85.1%)</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <span className="text-xs text-gray-500">Validation Split</span>
              <p className="text-sm font-semibold text-blue-400 mt-0.5">80% Train / 20% Test</p>
            </div>
          </div>
        </div>

        {/* Right: Urgent Dispatch Queue (1 Col) */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Top Dispatch Queue</h3>
                <p className="text-xs text-gray-500">Ranked by smart stockout priority</p>
              </div>
              <span className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg">
                High Urgent
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {priorityATMs.map((atm, idx) => (
                <div 
                  key={idx} 
                  className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-3.5 transition flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 font-mono">{atm.ATM_ID}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                        {atm.Location_Type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Current: <span className="text-gray-700">₹{atm.Previous_Day_Cash_Level?.toLocaleString()}</span> | Risk: <span className="text-red-600 font-semibold">{(atm.Stockout_Prob * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-amber-600">
                      +₹{atm.Recommended_Refill?.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Score: {(atm.Priority_Score * 100).toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('dispatch')}
            className="w-full mt-6 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            View Full Dispatch Table <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
