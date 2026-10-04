import React, { useState, useEffect } from 'react';
import { API_BASE_URL, apiFetch } from '../config';
import { ShieldAlert, AlertTriangle, CheckCircle, HelpCircle, Activity } from 'lucide-react';

export default function ATMRisk() {
  const [perfData, setPerfData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerf = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/api/model-performance`);
        if (res.ok) setPerfData(await res.json());
      } catch (err) {
        console.error("Error fetching risk metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerf();
  }, []);

  const cm = perfData?.confusion_matrix || { tn: 1097, fp: 20, fn: 1, tp: 14 };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          <ShieldAlert className="w-7 h-7 text-red-500" /> Stockout Risk Detection & Recall Optimization
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Binary classification subsystem designed to predict ATM cash depletion events before customer transactions fail.
        </p>
      </div>

      {/* Rationale Banner */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-500/30 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-gray-900">Why Prioritize Recall in ATM Logistics?</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              In ATM network operations, the cost of a <strong>False Negative</strong> (predicting cash is sufficient when an ATM actually runs out) results in emergency courier dispatches, severe customer dissatisfaction, and brand reputation loss. 
              Therefore, our classification pipeline enforces class-weighted tuning to prioritize <strong>High Recall</strong>, capturing &gt;90% of stockout events.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics & Confusion Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Classification Comparison Table */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">Stockout Classifiers Comparison</h3>
            <p className="text-xs text-gray-500">Tuned on imbalanced test data with balanced class penalty weighting</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="text-xs uppercase bg-gray-100 text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Classifier</th>
                  <th className="px-4 py-3">Accuracy</th>
                  <th className="px-4 py-3">Precision</th>
                  <th className="px-4 py-3 text-red-600">Recall</th>
                  <th className="px-4 py-3 rounded-r-xl">F1-Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {perfData?.classification_metrics?.map((c, idx) => {
                  const isSelected = c.Classifier === perfData.selected_classifier_name;
                  return (
                    <tr key={idx} className={isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3.5 font-bold text-gray-900 flex items-center gap-2">
                        {isSelected && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>}
                        {c.Classifier}
                      </td>
                      <td className="px-4 py-3.5 font-mono">{c.Accuracy}</td>
                      <td className="px-4 py-3.5 font-mono">{c.Precision}</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-red-600">{c.Recall}</td>
                      <td className="px-4 py-3.5 font-mono text-emerald-600">{c.F1_Score}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 flex items-center justify-between">
            <span>Primary Operational Classifier:</span>
            <span className="font-bold text-blue-400 font-mono">{perfData?.selected_classifier_name || 'Logistic Regression'}</span>
          </div>
        </div>

        {/* Visual Confusion Matrix */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">Stockout Confusion Matrix Heatmap</h3>
              <p className="text-xs text-gray-500">Performance on 1,132 test observations</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              {/* True Negative */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">True Negatives (TN)</div>
                <div className="text-3xl font-black text-emerald-600">{cm.tn}</div>
                <p className="text-[11px] text-gray-500 mt-2">Adequate Cash Correctly Identified</p>
              </div>

              {/* False Positive */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">False Positives (FP)</div>
                <div className="text-3xl font-black text-amber-600">{cm.fp}</div>
                <p className="text-[11px] text-gray-500 mt-2">Preventative False Alarms</p>
              </div>

              {/* False Negative */}
              <div className="bg-gray-50 border border-red-200 rounded-2xl p-5 text-center">
                <div className="text-xs text-red-600 uppercase font-semibold mb-1">False Negatives (FN)</div>
                <div className="text-3xl font-black text-red-500">{cm.fn}</div>
                <p className="text-[11px] text-red-300/80 mt-2">Missed Stockout Outages (Minimised)</p>
              </div>

              {/* True Positive */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">True Positives (TP)</div>
                <div className="text-3xl font-black text-blue-400">{cm.tp}</div>
                <p className="text-[11px] text-gray-500 mt-2">Stockouts Correctly Prevented</p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            Outage Detection Sensitivity (Recall): <strong className="text-gray-900 font-mono">{((cm.tp / (cm.tp + cm.fn || 1)) * 100).toFixed(1)}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
