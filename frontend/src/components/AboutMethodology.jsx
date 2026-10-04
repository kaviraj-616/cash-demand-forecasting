import React from 'react';
import { BookOpen, Target, Settings, Database, Cpu, TrendingUp, CheckCircle, Lightbulb } from 'lucide-react';

export default function AboutMethodology() {
  return (
    <div className="space-y-10 max-w-4xl mx-auto animate-fadeIn pb-12">
      
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-6">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-blue-600" /> Project Methodology & PBL Overview
        </h2>
        <p className="text-gray-600 text-sm mt-2 leading-relaxed">
          This academic Machine Learning project demonstrates a data-driven approach to ATM cash management. 
          The following sections detail the Project-Based Learning (PBL) objectives and the technical implementation workflow.
        </p>
      </div>

      {/* =========================================
          PART 1: PBL OVERVIEW
      ========================================= */}
      <section className="space-y-6">
        <h3 className="text-2xl font-bold text-gray-900 border-l-4 border-blue-600 pl-4">
          Part 1: Project-Based Learning (PBL) Overview
        </h3>

        {/* Problem Statement & Proposed Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-red-500" /> Problem Statement
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed">
              Banks need to maintain sufficient cash in ATMs. Too much cash causes inefficient cash management and ties up capital, while too little cash can result in ATM stockouts and customer dissatisfaction. Manually estimating future cash requirements can be difficult when there are multiple ATMs with different, complex demand patterns.
            </p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-emerald-500" /> Proposed Solution
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed">
              Our Machine Learning system predicts next-day ATM cash demand based on historical transaction data and environmental factors. It uses this prediction to identify stockout risk, calculate dynamic safety buffers, and recommend cash replenishment priorities via an interactive dashboard.
            </p>
          </div>
        </div>

        {/* Project Objectives */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h4 className="text-lg font-bold text-gray-900 mb-4">Project Objectives</h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> Predict next-day ATM cash demand</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> Compare different ML regression models</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> Identify possible stockout risk</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> Calculate recommended cash replenishment</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> Rank ATMs based on urgency</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> Support better cash dispatch decisions</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> Provide results through an interactive dashboard</li>
          </ul>
        </div>

        {/* Approach, Benefits, Future Scope */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h4 className="text-base font-bold text-gray-900 mb-2">ML Approach</h4>
            <p className="text-gray-700 text-sm leading-relaxed">
              The project uses <strong>Regression</strong> to forecast continuous cash demand values and <strong>Classification</strong> to predict categorical stockout risks. Models are evaluated on standard metrics before final decision-making logic converts predictions into dispatch actions.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h4 className="text-base font-bold text-gray-900 mb-2">Practical Benefits</h4>
            <p className="text-gray-700 text-sm leading-relaxed">
              Reduces the chance of cash shortages, supports better refill planning, prioritizes ATMs needing urgent attention, replaces manual estimation with data-driven workflows.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h4 className="text-base font-bold text-gray-900 mb-2">Future Scope</h4>
            <ul className="text-gray-700 text-sm space-y-1.5 list-disc list-inside">
              <li>Larger real-world ATM datasets</li>
              <li>Real-time ATM data integration</li>
              <li>Route optimization for cash vehicles</li>
              <li>Cloud deployment</li>
              <li>Automatic model retraining</li>
            </ul>
          </div>
        </div>
      </section>


      {/* =========================================
          PART 2: TECHNICAL METHODOLOGY
      ========================================= */}
      <section className="space-y-6 pt-6">
        <h3 className="text-2xl font-bold text-gray-900 border-l-4 border-blue-600 pl-4">
          Part 2: Technical Methodology
        </h3>
        <p className="text-gray-600 text-sm">
          The following sequence describes the actual data flow and logic implemented in the project, from raw data ingestion to the final dashboard recommendation.
        </p>

        <div className="space-y-4">
          
          {/* Step 1 & 2 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-indigo-500" /> Data Preprocessing & Feature Engineering
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                The dataset consists of historical ATM transactions. Missing values are imputed (e.g., using median for numerical data and mode for categoricals), and data types are standardized. We engineer useful features such as net cash flow, categorical encodings for location types, and flags for holidays or special events to help the models detect demand surges.
              </p>
            </div>
          </div>

          {/* Step 3 & 4 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-indigo-500" /> Model Training & Evaluation
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                The data is split chronologically into an 80% training set and a 20% test set to prevent data leakage. The primary ML task is predicting <strong>next-day ATM cash demand</strong>. We train multiple regression models including <strong>Ridge Regression</strong>, <strong>Random Forest Regressor</strong>, and <strong>Gradient Boosting Regressor</strong>. 
                Performance is evaluated using standard metrics: Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and the R² score to assess variance explanation.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" /> Stockout Risk Prediction
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Alongside regression, a separate classification model identifies whether an ATM is at risk of running out of cash (a binary outcome). This helps to catch unexpected spikes in demand that might lead to a complete cash depletion before the next scheduled refill.
              </p>
            </div>
          </div>

          {/* Step 6 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-indigo-500" /> Decision Engine & Final Output
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                The predicted demand and risk probabilities are combined to generate actionable insights:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-gray-700 list-disc list-inside ml-2">
                <li><strong>Safety Buffer:</strong> Extra cash calculated based on volatility, holidays, and predicted stockout risk.</li>
                <li><strong>Target Cash:</strong> The sum of predicted demand and the safety buffer.</li>
                <li><strong>Recommended Refill:</strong> The difference between the Target Cash and the ATM's current cash level.</li>
                <li><strong>Priority Level:</strong> ATMs are ranked (High, Medium, Low) based on their urgency to prevent outages.</li>
              </ul>
              <p className="text-gray-700 text-sm leading-relaxed mt-3">
                Finally, the dashboard displays this information, allowing users to easily see which ATMs require immediate dispatch attention.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Academic Disclaimer */}
      <div className="mt-8 py-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          This project is developed as an educational undergraduate PBL machine learning simulation. It uses static datasets and does not interface with live commercial banking core networks.
        </p>
      </div>

    </div>
  );
}
