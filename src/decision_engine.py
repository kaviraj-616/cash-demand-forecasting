import pandas as pd
import numpy as np
from typing import Dict, Any

def compute_refill_and_priority(
    pred_demand: float,
    current_cash: float,
    holiday_flag: int,
    location_type: str,
    stockout_prob: float
) -> Dict[str, Any]:
    """
    Computes dynamic safety buffer, required target cash, recommended refill amount,
    and dispatch priority metrics for a given ATM observation.
    
    Formulation:
    Total Buffer % = 10% (Base) + 5% (Holiday) + 5% (High Volatility Location) + (Stockout Prob * 10%)
    Target Cash = Predicted Demand + Safety Buffer
    Recommended Refill = max(0, Target Cash - Current Cash)
    Priority Score = (Stockout Prob * 0.6) + (Deficit Ratio * 0.4)
    """
    pred_demand = max(0.0, float(pred_demand))
    current_cash = max(0.0, float(current_cash))
    stockout_prob = min(1.0, max(0.0, float(stockout_prob)))
    
    # 1. Dynamic Buffer Percentage calculation
    base_buffer = 0.10
    holiday_buffer = 0.05 if (holiday_flag == 1 or str(holiday_flag).lower() in ['1', 'true']) else 0.0
    high_volatility_locations = {'Mall', 'Supermarket', 'Standalone'}
    volatility_buffer = 0.05 if str(location_type).strip() in high_volatility_locations else 0.0
    risk_buffer = stockout_prob * 0.10
    
    total_buffer_pct = base_buffer + holiday_buffer + volatility_buffer + risk_buffer
    safety_buffer = round(pred_demand * total_buffer_pct, 2)
    target_cash = round(pred_demand + safety_buffer, 2)
    
    # 2. Refill Recommendation
    recommended_refill = round(max(0.0, target_cash - current_cash), 2)
    
    # 3. Deficit Ratio & Priority Scoring
    deficit = max(0.0, pred_demand - current_cash)
    deficit_ratio = min(1.0, deficit / (pred_demand + 1e-5))
    
    priority_score = round((stockout_prob * 0.6) + (deficit_ratio * 0.4), 4)
    
    # 4. Priority Categorization
    if priority_score >= 0.50 or stockout_prob >= 0.40 or recommended_refill >= 40000.0:
        priority_level = 'HIGH'
    elif priority_score >= 0.20 or recommended_refill > 0.0:
        priority_level = 'MEDIUM'
    else:
        priority_level = 'LOW'
        
    return {
        'safety_buffer': safety_buffer,
        'target_cash': target_cash,
        'recommended_refill': recommended_refill,
        'priority_score': priority_score,
        'priority_level': priority_level,
        'buffer_percentage': round(total_buffer_pct * 100, 2)
    }

def process_dispatch_decisions(
    test_df: pd.DataFrame,
    reg_preds: np.ndarray,
    cls_probs: np.ndarray
) -> pd.DataFrame:
    """
    Applies the smart dispatch decision engine across all test dataset rows,
    calculates refill orders, and sorts ATMs into priority queues (HIGH, MEDIUM, LOW).
    """
    df_out = test_df.copy().reset_index(drop=True)
    df_out['Pred_Demand'] = np.maximum(0.0, np.round(reg_preds, 2))
    df_out['Stockout_Prob'] = np.clip(np.round(cls_probs, 4), 0.0, 1.0)
    
    safety_buffers = []
    target_cashes = []
    recommended_refills = []
    priority_scores = []
    priority_levels = []
    
    for _, row in df_out.iterrows():
        dec = compute_refill_and_priority(
            pred_demand=row['Pred_Demand'],
            current_cash=row['Previous_Day_Cash_Level'],
            holiday_flag=row.get('Holiday_Flag', 0),
            location_type=row.get('Location_Type', 'Standalone'),
            stockout_prob=row['Stockout_Prob']
        )
        safety_buffers.append(dec['safety_buffer'])
        target_cashes.append(dec['target_cash'])
        recommended_refills.append(dec['recommended_refill'])
        priority_scores.append(dec['priority_score'])
        priority_levels.append(dec['priority_level'])
        
    df_out['Safety_Buffer'] = safety_buffers
    df_out['Target_Cash'] = target_cashes
    df_out['Recommended_Refill'] = recommended_refills
    df_out['Priority_Score'] = priority_scores
    df_out['Priority_Level'] = priority_levels
    
    # Priority sorting: HIGH -> MEDIUM -> LOW, then by Priority_Score descending
    priority_map = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
    df_out['priority_rank'] = df_out['Priority_Level'].map(priority_map)
    df_out = df_out.sort_values(
        by=['priority_rank', 'Priority_Score', 'Recommended_Refill'],
        ascending=[True, False, False]
    ).drop(columns=['priority_rank']).reset_index(drop=True)
    
    return df_out
