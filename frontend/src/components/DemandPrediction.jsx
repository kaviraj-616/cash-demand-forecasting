import React, { useState, useEffect } from 'react';
import { API_BASE_URL, apiFetch } from '../config';
import { TrendingUp, AlertCircle, BarChart3, CheckCircle2, RefreshCw } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function DemandPrediction() {
  const [chartData, setChartData] = useState([]);
  const [modelPerf, setModelPerf] = useState(null);
  const [limit, setLimit] = useState(40);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [chartRes, perfRes] = await Promise.all([
        apiFetch(`${API_BASE_URL}/api/forecast-chart?limit=${limit}`),
        apiFetch(`${API_BASE_URL}/api/model-performance`)
      ]);

      if (!chartRes.ok || !perfRes.ok) {
        throw new Error("Failed to load forecast data from server.");
      }

      const chart = await chartRes.json();
      const perf = await perfRes.json();

      setChartData(chart);
      setModelPerf(perf);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [limit]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-blue-500" /> Cash Demand Forecasting Engine
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Regression models predicting continuous next-day cash demand (₹) based on transaction flow, calendar variables, and weather attributes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-500 font-medium">Test Observations:</label>
          <select 
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-gray-100 border border-gray-200 text-gray-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value={20}>20 Samples</option>
            <option value={40}>40 Samples</option>
            <option value={80}>80 Samples</option>
            <option value={150}>150 Samples</option>
          </select>
          <button 
            onClick={fetchData}
            className="p-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-gray-700 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Computing forecast telemetry...</p>
        </div>
      ) : error ? (
        <div className="bg-red-950/40 border border-red-800 p-6 rounded-2xl text-center text-red-200">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Main Chart Card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Chronological Actual vs Predicted Cash Demand</h3>
                <p className="text-xs text-gray-500">Comparing ground-truth consumption against {modelPerf?.best_model_name || 'Ensemble Model'} outputs</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-blue-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Actual Demand
                </span>
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium ml-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Predicted Demand
                </span>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', color: '#111827', borderColor: '#E2E8F0', borderRadius: '0.75rem', fontSize: '12px' }}
                    formatter={(val) => [`₹${Number(val).toLocaleString()}`, '']}
                  />
                  <Line type="monotone" dataKey="actual" name="Actual (₹)" stroke="#3B82F6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="predicted" name="Predicted (₹)" stroke="#10B981" strokeWidth={2.5} strokeDasharray="4 4" dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Model Regression Benchmark Table */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">Regression Forecast Performance Benchmarks</h3>
              <p className="text-xs text-gray-500">Evaluated on unseen test partition (1,132 historical ATM days)</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="text-xs uppercase bg-gray-100 text-gray-500 font-semibold">
                  <tr>
                    <th className="px-6 py-4 rounded-l-xl">Regression Model</th>
                    <th className="px-6 py-4">MAE (₹)</th>
                    <th className="px-6 py-4">RMSE (₹)</th>
                    <th className="px-6 py-4">R² Score</th>
                    <th className="px-6 py-4 rounded-r-xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {modelPerf?.regression_metrics?.map((m, idx) => (
                    <tr key={idx} className="hover:bg-gray-100/30 transition">
                      <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                        {m.Model.includes('Ensemble') && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        {m.Model}
                      </td>
                      <td className="px-6 py-4 font-mono">₹{m.MAE?.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono font-semibold text-blue-400">₹{m.RMSE?.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono font-bold text-emerald-600">{m.R2_Score}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-500/20">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
