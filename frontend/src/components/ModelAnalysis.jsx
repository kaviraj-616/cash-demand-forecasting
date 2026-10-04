import React, { useState, useEffect } from 'react';
import { API_BASE_URL, apiFetch, BASE_URL } from '../config';
import { BarChart3, Sliders, Image as ImageIcon, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function ModelAnalysis() {
  const [perfData, setPerfData] = useState(null);
  const [importanceData, setImportanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const [perfRes, impRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/api/model-performance`),
          apiFetch(`${API_BASE_URL}/api/feature-importance`)
        ]);

        if (perfRes.ok) setPerfData(await perfRes.json());
        if (impRes.ok) setImportanceData(await impRes.json());
      } catch (err) {
        console.error("Error loading model analysis:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, []);

  const plots = [
    { title: 'Actual vs. Predicted Cash Demand', file: 'actual_vs_predicted.png', desc: 'Scatter plot of test samples with ideal reference line' },
    { title: 'Comparative Model Performance', file: 'model_comparison.png', desc: 'RMSE and R² benchmarks across all regression algorithms' },
    { title: 'Feature Importance Analysis', file: 'feature_importance.png', desc: 'Top Gini feature contributors from Random Forest regressor' },
    { title: 'Stockout Confusion Matrix', file: 'confusion_matrix.png', desc: 'Heatmap showing True vs Predicted cash outage occurrences' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          <BarChart3 className="w-7 h-7 text-indigo-400" /> Machine Learning Model Evaluation & Architecture
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          In-depth diagnostics, hyperparameter grid search results, feature importance rankings, and high-resolution evaluation figures.
        </p>
      </div>

      {/* Feature Importance & Tuning Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Feature Importance Chart */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">Top Feature Importances (Random Forest)</h3>
            <p className="text-xs text-gray-500">Relative impact of engineered transaction and calendar attributes</p>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={importanceData}
                margin={{ top: 10, right: 30, left: 70, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" stroke="#64748B" fontSize={11} />
                <YAxis dataKey="feature" type="category" stroke="#94A3B8" fontSize={11} tickLine={false} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', color: '#111827', borderColor: '#E2E8F0', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(val) => [(Number(val) * 100).toFixed(2) + '%', 'Importance']}
                />
                <Bar dataKey="importance" fill="#6366F1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hyperparameter Tuning & Pipeline Specifications */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-gray-900">GridSearchCV Hyperparameter Results</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-gray-900">Ridge Regression</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono">
                    Alpha: {perfData?.tuning_parameters?.Ridge?.alpha ?? '1.0'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">L2 regularized linear model evaluated on scaled feature matrix.</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-gray-900">Random Forest Regressor</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                    Trees: {perfData?.tuning_parameters?.['Random Forest']?.n_estimators ?? '100'} | Depth: {perfData?.tuning_parameters?.['Random Forest']?.max_depth ?? '10'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Non-linear ensemble capturing complex interactions and split points.</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-gray-900">Gradient Boosting Regressor</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                    LR: {perfData?.tuning_parameters?.['Gradient Boosting']?.learning_rate ?? '0.1'} | Depth: {perfData?.tuning_parameters?.['Gradient Boosting']?.max_depth ?? '3'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Sequential gradient descent boosting minimizing squared loss.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong>Inverse-RMSE Weighting:</strong> Rather than equal averaging, the ensemble assigns larger weights to models with lower validation RMSE, maximizing predictive stability.
            </span>
          </div>
        </div>
      </div>

      {/* Exported Plot Figures Gallery */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <ImageIcon className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-gray-900">Generated High-Resolution Model Visualizations</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {plots.map((p, idx) => (
            <div key={idx} className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-600 transition">
              <div className="mb-3">
                <h4 className="font-bold text-gray-900 text-sm">{p.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
              </div>
              <div className="bg-white rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center min-h-[220px]">
                <img 
                  src={`${BASE_URL}plots/${p.file}`} 
                  alt={p.title} 
                  className="w-full h-auto object-contain hover:scale-105 transition duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%2364748b'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='12'%3EPlot Rendering%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
              <div className="mt-3 flex justify-end">
                <a 
                  href={`${BASE_URL}plots/${p.file}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-700 flex items-center gap-1 font-semibold"
                >
                  Open Full Image <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
