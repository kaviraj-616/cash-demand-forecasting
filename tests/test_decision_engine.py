import pytest
import pandas as pd
import numpy as np
from src.decision_engine import compute_refill_and_priority, process_dispatch_decisions

def test_compute_refill_and_priority_basic():
    # Base case: Bank Branch (non-volatile), no holiday, 0 stockout prob
    # Demand = 100,000, Current Cash = 80,000
    # Buffer % = 10% (Base) = 10,000
    # Target Cash = 110,000
    # Refill = 110,000 - 80,000 = 30,000
    res = compute_refill_and_priority(
        pred_demand=100000,
        current_cash=80000,
        holiday_flag=0,
        location_type='Bank Branch',
        stockout_prob=0.0
    )
    
    assert res['safety_buffer'] == 10000.0
    assert res['target_cash'] == 110000.0
    assert res['recommended_refill'] == 30000.0
    assert res['priority_level'] in ['MEDIUM', 'HIGH', 'LOW']

def test_compute_refill_and_priority_surge():
    # High volatility location (Mall) + Holiday flag + High stockout prob (0.8)
    # Base (10%) + Holiday (5%) + Mall (5%) + Stockout (8%) = 28% buffer
    # Demand = 50,000, Buffer = 14,000, Target = 64,000
    # Current cash = 10,000 -> Refill = 54,000 (HIGH priority)
    res = compute_refill_and_priority(
        pred_demand=50000,
        current_cash=10000,
        holiday_flag=1,
        location_type='Mall',
        stockout_prob=0.8
    )
    
    assert res['safety_buffer'] == 14000.0
    assert res['target_cash'] == 64000.0
    assert res['recommended_refill'] == 54000.0
    assert res['priority_level'] == 'HIGH'
    assert res['priority_score'] > 0.5

def test_compute_refill_zero_refill():
    # Excess cash in machine -> Refill should be 0
    res = compute_refill_and_priority(
        pred_demand=20000,
        current_cash=150000,
        holiday_flag=0,
        location_type='Standalone',
        stockout_prob=0.01
    )
    assert res['recommended_refill'] == 0.0
    assert res['priority_level'] == 'LOW'

def test_process_dispatch_decisions_ordering():
    test_df = pd.DataFrame({
        'ATM_ID': ['ATM_LOW', 'ATM_HIGH', 'ATM_MED'],
        'Date': ['2023-01-01', '2023-01-01', '2023-01-01'],
        'Location_Type': ['Bank Branch', 'Mall', 'Supermarket'],
        'Holiday_Flag': [0, 1, 0],
        'Previous_Day_Cash_Level': [150000, 10000, 40000],
        'Cash_Demand_Next_Day': [20000, 80000, 45000]
    })
    
    reg_preds = np.array([20000.0, 80000.0, 45000.0])
    cls_probs = np.array([0.01, 0.95, 0.20])
    
    ranked = process_dispatch_decisions(test_df, reg_preds, cls_probs)
    
    assert len(ranked) == 3
    # First ranked ATM must be the HIGH priority one
    assert ranked.iloc[0]['Priority_Level'] == 'HIGH'
    assert ranked.iloc[0]['ATM_ID'] == 'ATM_HIGH'
    assert ranked.iloc[-1]['Priority_Level'] == 'LOW'
