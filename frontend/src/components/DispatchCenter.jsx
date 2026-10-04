import React, { useState, useEffect } from 'react';
import { API_BASE_URL, apiFetch } from '../config';
import { Truck, Search, Filter, AlertTriangle, ShieldCheck, Clock, Download } from 'lucide-react';

export default function DispatchCenter() {
  const [atms, setAtms] = useState([]);
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/atm-rankings?limit=100`);
      if (res.ok) {
        setAtms(await res.json());
      }
    } catch (err) {
      console.error("Error loading ATM rankings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const filteredATMs = atms.filter(atm => {
    const matchesPriority = filterPriority === 'ALL' || atm.Priority_Level === filterPriority;
    const matchesSearch = 
      atm.ATM_ID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      atm.Location_Type?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  const highCount = atms.filter(a => a.Priority_Level === 'HIGH').length;
  const medCount = atms.filter(a => a.Priority_Level === 'MEDIUM').length;
  const lowCount = atms.filter(a => a.Priority_Level === 'LOW').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-amber-500" /> Smart Replenishment Dispatch Center
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Dynamic prioritization engine calculating variable safety buffers and cash refill orders for Cash-In-Transit (CIT) logistics teams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setFilterPriority('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${filterPriority === 'ALL' ? 'bg-blue-600 text-gray-900' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All ({atms.length})
          </button>
          <button 
            onClick={() => setFilterPriority('HIGH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${filterPriority === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-red-600 hover:bg-gray-200'}`}
          >
            High ({highCount})
          </button>
          <button 
            onClick={() => setFilterPriority('MEDIUM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${filterPriority === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-amber-600 hover:bg-gray-200'}`}
          >
            Medium ({medCount})
          </button>
          <button 
            onClick={() => setFilterPriority('LOW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${filterPriority === 'LOW' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-emerald-600 hover:bg-gray-200'}`}
          >
            Low ({lowCount})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search ATM ID or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="text-xs text-gray-500">
          Showing <span className="font-bold text-gray-900">{filteredATMs.length}</span> ranked operational records
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="text-xs uppercase bg-gray-50 text-gray-500 font-semibold">
              <tr>
                <th className="px-5 py-4">Priority</th>
                <th className="px-5 py-4">ATM ID</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Current Cash</th>
                <th className="px-5 py-4">Forecast Demand</th>
                <th className="px-5 py-4">Stockout Prob</th>
                <th className="px-5 py-4">Dynamic Buffer</th>
                <th className="px-5 py-4 text-amber-600 font-bold">Recommended Refill</th>
                <th className="px-5 py-4">Priority Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-gray-500">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading dispatch queue...
                  </td>
                </tr>
              ) : filteredATMs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-gray-500">
                    No ATMs found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredATMs.map((atm, idx) => {
                  let badgeColor = 'bg-gray-200 text-gray-700';
                  if (atm.Priority_Level === 'HIGH') badgeColor = 'text-red-700 font-bold';
                  if (atm.Priority_Level === 'MEDIUM') badgeColor = 'text-amber-700 font-bold';
                  if (atm.Priority_Level === 'LOW') badgeColor = 'text-emerald-700 font-bold';

                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3.5">
                        <span className={`text-xs uppercase tracking-wider ${badgeColor}`}>
                          {atm.Priority_Level}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold font-mono text-gray-900">{atm.ATM_ID}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-700">{atm.Location_Type}</td>
                      <td className="px-5 py-3.5 font-mono text-xs">₹{atm.Previous_Day_Cash_Level?.toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-blue-400 font-semibold">₹{atm.Pred_Demand?.toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-mono text-xs">
                        <span className={atm.Stockout_Prob > 0.4 ? 'text-red-600 font-bold' : 'text-gray-700'}>
                          {(atm.Stockout_Prob * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500">₹{atm.Safety_Buffer?.toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-mono text-sm font-black text-amber-600">
                        {atm.Recommended_Refill > 0 ? `+₹${atm.Recommended_Refill?.toLocaleString()}` : '₹0 (Sufficient)'}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-700">
                        {(atm.Priority_Score * 100).toFixed(1)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
