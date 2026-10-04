import React, { useState } from 'react';
import { API_BASE_URL, apiFetch } from '../config';
import { Sparkles, Calculator, AlertCircle, ArrowRight, ShieldCheck, DollarSign, Activity } from 'lucide-react';

export default function WhatIfPrediction() {
  const [formData, setFormData] = useState({
    Previous_Day_Cash_Level: 95000,
    Total_Withdrawals: 52000,
    Total_Deposits: 12000,
    Day_of_Week: 'Friday',
    Time_of_Day: 'Morning',
    Location_Type: 'Mall',
    Weather_Condition: 'Rainy',
    Holiday_Flag: 0,
    Special_Event_Flag: 1,
    Nearby_Competitor_ATMs: 3,
    Month: 8,
    Day_of_Month: 28
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Prediction request failed.");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-7 h-7 text-blue-400" /> Interactive "What-If" Scenario Simulator
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Adjust environmental, transaction, and location parameters to simulate next-day cash demand, compute stockout probability, and verify dynamic replenishment buffers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Container (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-3xl p-6 md:p-8">
          <form onSubmit={handlePredict} className="space-y-6">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-3">
              <Calculator className="w-4 h-4 text-blue-400" /> Scenario Parameter Controls
            </h3>

            {/* Financial Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Current Cash Level (₹)
                </label>
                <input
                  type="number"
                  name="Previous_Day_Cash_Level"
                  value={formData.Previous_Day_Cash_Level}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Today's Withdrawals (₹)
                </label>
                <input
                  type="number"
                  name="Total_Withdrawals"
                  value={formData.Total_Withdrawals}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Today's Deposits (₹)
                </label>
                <input
                  type="number"
                  name="Total_Deposits"
                  value={formData.Total_Deposits}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Categorical Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Location Type</label>
                <select
                  name="Location_Type"
                  value={formData.Location_Type}
                  onChange={handleChange}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Mall">Mall (High Volatility)</option>
                  <option value="Supermarket">Supermarket (High Volatility)</option>
                  <option value="Standalone">Standalone</option>
                  <option value="Bank Branch">Bank Branch</option>
                  <option value="Gas Station">Gas Station</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Weather Condition</label>
                <select
                  name="Weather_Condition"
                  value={formData.Weather_Condition}
                  onChange={handleChange}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Clear">Clear</option>
                  <option value="Cloudy">Cloudy</option>
                  <option value="Rainy">Rainy</option>
                  <option value="Snowy">Snowy</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Day of the Week</label>
                <select
                  name="Day_of_Week"
                  value={formData.Day_of_Week}
                  onChange={handleChange}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday (Weekend)</option>
                  <option value="Sunday">Sunday (Weekend)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Time of Day</label>
                <select
                  name="Time_of_Day"
                  value={formData.Time_of_Day}
                  onChange={handleChange}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                </select>
              </div>
            </div>

            {/* Special Flags */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Holiday Surge</label>
                <select
                  name="Holiday_Flag"
                  value={formData.Holiday_Flag}
                  onChange={handleChange}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value={0}>No (0)</option>
                  <option value={1}>Yes (1 - Adds 5% Buffer)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Special Event</label>
                <select
                  name="Special_Event_Flag"
                  value={formData.Special_Event_Flag}
                  onChange={handleChange}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value={0}>No (0)</option>
                  <option value={1}>Yes (1)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nearby Competitors</label>
                <input
                  type="number"
                  name="Nearby_Competitor_ATMs"
                  value={formData.Nearby_Competitor_ATMs}
                  onChange={handleChange}
                  min="0"
                  max="10"
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-gray-900 font-bold rounded-2xl shadow-xl shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Evaluating ML Models...</span>
                </>
              ) : (
                <>
                  <span>Run Real-Time Prediction & Dispatch Calculation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Container (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                <h3 className="text-base font-bold text-gray-900">Smart Engine Output</h3>
                {result && (
                  <span className={`text-sm font-bold ${
                    result.priority_level === 'HIGH' ? 'text-red-700 font-bold' :
                    result.priority_level === 'MEDIUM' ? 'text-amber-700 font-bold' :
                    'text-emerald-700 font-bold'
                  }`}>
                    {result.priority_level} PRIORITY
                  </span>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-950/50 border border-red-800 rounded-2xl text-xs text-red-300 mb-4">
                  {error}
                </div>
              )}

              {result ? (
                <div className="space-y-4 animate-fadeIn">
                  {/* Predicted Demand */}
                  <div className="bg-gray-100 border border-gray-200 rounded-2xl p-4">
                    <span className="text-xs text-gray-500 font-medium">Forecast Next-Day Demand</span>
                    <div className="text-3xl font-black text-gray-900 mt-1">₹{result.predicted_demand?.toLocaleString()}</div>
                    <span className="text-[11px] text-blue-400 font-medium">Model: {result.best_model_used}</span>
                  </div>

                  {/* Stockout Risk & Dynamic Buffer Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-100 border border-gray-200 rounded-2xl p-4">
                      <span className="text-xs text-gray-500 font-medium">Stockout Probability</span>
                      <div className={`text-2xl font-black mt-1 ${result.stockout_probability > 40 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {result.stockout_probability}%
                      </div>
                      <span className="text-[10px] text-gray-500">Recall-Tuned</span>
                    </div>

                    <div className="bg-gray-100 border border-gray-200 rounded-2xl p-4">
                      <span className="text-xs text-gray-500 font-medium">Dynamic Buffer</span>
                      <div className="text-2xl font-black text-indigo-400 mt-1">₹{result.safety_buffer?.toLocaleString()}</div>
                      <span className="text-[10px] text-gray-500">Variable %</span>
                    </div>
                  </div>

                  {/* Target Cash & Refill Recommendation */}
                  <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-900 font-semibold">Recommended Cash Refill</span>
                      <span className="text-xs text-gray-500">Target: ₹{result.target_cash?.toLocaleString()}</span>
                    </div>
                    <div className="text-3xl font-black text-blue-600">
                      {result.recommended_refill > 0 ? `+₹${result.recommended_refill?.toLocaleString()}` : '₹0 (Sufficient)'}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Priority Score: <strong className="text-gray-900">{(result.priority_score * 100).toFixed(1)}</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500 space-y-3">
                  <Activity className="w-12 h-12 mx-auto text-slate-700" />
                  <p className="text-xs">Adjust parameters on the left and click predict to run the smart engine.</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 text-[11px] text-gray-500 text-center">
              Real-time inference using Ridge, Tree Ensembles, and Logistic Classifiers.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
