export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const IS_STATIC = import.meta.env.VITE_IS_STATIC === 'true' || false;
export const BASE_URL = import.meta.env.BASE_URL;

export const apiFetch = async (url, options) => {
  if (IS_STATIC) {
    if (url.includes('/api/predict')) {
      return {
        ok: true,
        json: async () => ({
          predicted_demand: 125000,
          best_model_used: "Static Mock Ensemble",
          stockout_probability: 35,
          safety_buffer: 15000,
          target_cash: 140000,
          recommended_refill: 45000,
          priority_score: 0.75,
          priority_level: "MEDIUM"
        })
      };
    }
    
    let jsonFile = '';
    if (url.includes('dashboard-summary')) jsonFile = 'dashboard-summary.json';
    else if (url.includes('model-performance')) jsonFile = 'model-performance.json';
    else if (url.includes('feature-importance')) jsonFile = 'feature-importance.json';
    else if (url.includes('forecast-chart')) {
      const match = url.match(/limit=(\d+)/);
      const limit = match ? match[1] : 20;
      jsonFile = `forecast-chart-${limit}.json`;
    }
    else if (url.includes('atm-rankings')) {
      const match = url.match(/limit=(\d+)/);
      const limit = match ? match[1] : 5;
      jsonFile = `atm-rankings-${limit}.json`;
    }
    else if (url.endsWith('/')) {
        return { ok: true };
    }

    if (jsonFile) {
        return fetch(`${BASE_URL}api/${jsonFile}`);
    }
  }
  return fetch(url, options);
};
