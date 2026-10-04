import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import List, Dict, Any

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from src.decision_engine import compute_refill_and_priority

app = FastAPI(
    title="ATM Cash Demand Forecasting & Smart Dispatch Decision Engine API",
    description="Backend API serving predictions and replenishment decisions using trained ML models.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = os.path.join(BASE_DIR, 'models')
OUTPUTS_DIR = os.path.join(BASE_DIR, 'outputs')
PLOTS_DIR = os.path.join(OUTPUTS_DIR, 'plots')
METRICS_DIR = os.path.join(OUTPUTS_DIR, 'metrics')

# Ensure directories exist before mounting static files
os.makedirs(PLOTS_DIR, exist_ok=True)
os.makedirs(METRICS_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# Mount outputs/plots to serve evaluation charts
app.mount("/plots", StaticFiles(directory=PLOTS_DIR), name="plots")

# Helper to load CSV or return None
def get_metrics_data(filename: str):
    path = os.path.join(METRICS_DIR, filename)
    if not os.path.exists(path):
        return None
    try:
        return pd.read_csv(path)
    except Exception as e:
        print(f"Error reading {filename}: {e}")
        return None

# What-If Input Schema
class WhatIfRequest(BaseModel):
    Previous_Day_Cash_Level: float = Field(..., ge=0, description="Current Cash Level in the ATM (₹)")
    Day_of_Week: str = Field(..., description="Day of the week (e.g. Monday, Tuesday...)")
    Time_of_Day: str = Field(..., description="Time of day (Morning, Afternoon, Evening, Night)")
    Location_Type: str = Field(..., description="Location type (Standalone, Supermarket, Mall, Gas Station, Bank Branch)")
    Weather_Condition: str = Field(..., description="Weather (Clear, Cloudy, Rainy, Snowy)")
    Holiday_Flag: int = Field(0, ge=0, le=1, description="1 if holiday, else 0")
    Special_Event_Flag: int = Field(0, ge=0, le=1, description="1 if special event, else 0")
    Nearby_Competitor_ATMs: int = Field(0, ge=0, description="Number of competitors nearby")
    Total_Withdrawals: float = Field(..., ge=0, description="Today's total withdrawals")
    Total_Deposits: float = Field(..., ge=0, description="Today's total deposits")
    Month: int = Field(8, ge=1, le=12, description="Month of prediction (1-12)")
    Day_of_Month: int = Field(27, ge=1, le=31, description="Day of month (1-31)")

@app.get("/")
def root():
    """
    Health check and service status.
    """
    pipeline_trained = os.path.exists(os.path.join(METRICS_DIR, 'dispatch_decisions.csv'))
    return {
        "status": "online",
        "service": "ATM Cash Demand Forecasting & Dispatch Decision Engine API",
        "pipeline_trained": pipeline_trained,
        "endpoints": [
            "/api/dashboard-summary",
            "/api/atm-rankings",
            "/api/model-performance",
            "/api/feature-importance",
            "/api/forecast-chart",
            "/api/predict"
        ]
    }

@app.get("/api/dashboard-summary")
def get_dashboard_summary():
    """
    Returns summary analytics from the test dataset decisions database.
    """
    decisions = get_metrics_data('dispatch_decisions.csv')
    if decisions is None or decisions.empty:
        raise HTTPException(
            status_code=503,
            detail="Pipeline data not generated yet. Please run 'python main_pipeline.py' first."
        )
        
    total_atms = int(decisions['ATM_ID'].nunique()) if 'ATM_ID' in decisions.columns else len(decisions)
    high_risk_atms = int((decisions['Priority_Level'] == 'HIGH').sum())
    avg_pred_demand = float(decisions['Pred_Demand'].mean())
    total_refill = float(decisions['Recommended_Refill'].sum())
    
    return {
        "total_atms": total_atms,
        "high_risk_atms": high_risk_atms,
        "avg_pred_demand": round(avg_pred_demand, 2),
        "total_refill": round(total_refill, 2)
    }

@app.get("/api/atm-rankings")
def get_atm_rankings(limit: int = 15):
    """
    Returns ranked ATMs sorted by priority level and priority score.
    """
    decisions = get_metrics_data('dispatch_decisions.csv')
    if decisions is None or decisions.empty:
        raise HTTPException(status_code=503, detail="Pipeline data not generated yet.")
        
    cols = [
        'ATM_ID', 'Date', 'Location_Type', 'Previous_Day_Cash_Level',
        'Pred_Demand', 'Stockout_Prob', 'Safety_Buffer', 'Recommended_Refill',
        'Priority_Score', 'Priority_Level'
    ]
    available_cols = [c for c in cols if c in decisions.columns]
    
    decisions_copy = decisions[available_cols].copy()
    if 'Date' in decisions_copy.columns:
        decisions_copy['Date'] = pd.to_datetime(decisions_copy['Date'], errors='coerce').dt.strftime('%Y-%m-%d')
        
    sample_decisions = decisions_copy.head(limit).to_dict(orient='records')
    return sample_decisions

@app.get("/api/model-performance")
def get_model_performance():
    """
    Returns comparative regression and classification performance metrics.
    """
    reg_metrics = get_metrics_data('regression_metrics.csv')
    cls_metrics = get_metrics_data('classification_metrics.csv')
    
    metadata_path = os.path.join(MODELS_DIR, 'pipeline_metadata.json')
    metadata = {}
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
        except Exception:
            metadata = {}
            
    if reg_metrics is None or cls_metrics is None:
        raise HTTPException(status_code=503, detail="Pipeline metrics not generated yet.")
        
    return {
        "best_model_name": metadata.get('best_model_name', 'Ensemble Model'),
        "selected_classifier_name": metadata.get('selected_classifier_name', 'Logistic Regression'),
        "regression_metrics": reg_metrics.to_dict(orient='records'),
        "classification_metrics": cls_metrics.to_dict(orient='records'),
        "confusion_matrix": metadata.get('classifier_confusion_matrix', {}),
        "tuning_parameters": metadata.get('tuning_parameters', {})
    }

@app.get("/api/feature-importance")
def get_feature_importance():
    """
    Returns top feature importance values from model metadata.
    """
    metadata_path = os.path.join(MODELS_DIR, 'pipeline_metadata.json')
    if not os.path.exists(metadata_path):
        raise HTTPException(status_code=503, detail="Model metadata not found.")
        
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
        
    importances = metadata.get('feature_importance_rf', {})
    chart_data = [{"feature": k, "importance": round(v, 4)} for k, v in importances.items()]
    chart_data = sorted(chart_data, key=lambda x: x['importance'], reverse=True)[:10]
    return chart_data

@app.get("/api/forecast-chart")
def get_forecast_chart(limit: int = 50):
    """
    Returns chronological actual vs predicted demand records for chart plotting.
    """
    decisions = get_metrics_data('dispatch_decisions.csv')
    if decisions is None or decisions.empty:
        raise HTTPException(status_code=503, detail="Pipeline data not generated yet.")
        
    decisions_copy = decisions.copy()
    if 'Date' in decisions_copy.columns:
        decisions_copy['Date'] = pd.to_datetime(decisions_copy['Date'], errors='coerce')
        dec_sorted = decisions_copy.sort_values(by='Date')
    else:
        dec_sorted = decisions_copy
        
    chart_data = []
    for _, row in dec_sorted.head(limit).iterrows():
        date_str = row['Date'].strftime('%m-%d') if pd.notnull(row.get('Date')) else 'N/A'
        chart_data.append({
            "date": date_str,
            "actual": float(row['Cash_Demand_Next_Day']) if 'Cash_Demand_Next_Day' in row else float(row.get('Pred_Demand', 0)),
            "predicted": float(row.get('Pred_Demand', 0))
        })
        
    return chart_data

@app.post("/api/predict")
def predict_what_if(req: WhatIfRequest):
    """
    Predicts cash demand, stockout risk probability, dynamic buffer, and refill recommendations
    for custom interactive user inputs.
    """
    meta_path = os.path.join(MODELS_DIR, 'categorical_metadata.json')
    metadata_path = os.path.join(MODELS_DIR, 'pipeline_metadata.json')
    
    if not os.path.exists(meta_path) or not os.path.exists(metadata_path):
        raise HTTPException(status_code=503, detail="Trained model metadata not found. Please train models first.")
        
    with open(meta_path, 'r') as f:
        meta = json.load(f)
        
    with open(metadata_path, 'r') as f:
        pipeline_meta = json.load(f)
        
    best_model_name = pipeline_meta.get('best_model_name', 'Ensemble Model')
    selected_cls_name = pipeline_meta.get('selected_classifier_name', 'Logistic Regression')
    
    # Load model binaries
    try:
        ridge_best = joblib.load(os.path.join(MODELS_DIR, 'ridge_model.pkl'))
        rf_best = joblib.load(os.path.join(MODELS_DIR, 'random_forest_model.pkl'))
        gb_best = joblib.load(os.path.join(MODELS_DIR, 'gradient_boosting_model.pkl'))
        scaler = joblib.load(os.path.join(MODELS_DIR, 'ensemble_scaler.pkl'))
        stockout_classifier = joblib.load(os.path.join(MODELS_DIR, 'stockout_model.pkl'))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading model binaries: {str(e)}")
        
    # Re-create feature vector
    feature_cols = meta['feature_columns']
    feature_dict = {col: 0.0 for col in feature_cols}
    
    # Numerical features
    feature_dict['Previous_Day_Cash_Level'] = float(req.Previous_Day_Cash_Level)
    feature_dict['Holiday_Flag'] = float(req.Holiday_Flag)
    feature_dict['Special_Event_Flag'] = float(req.Special_Event_Flag)
    feature_dict['Nearby_Competitor_ATMs'] = float(req.Nearby_Competitor_ATMs)
    feature_dict['Month'] = float(req.Month)
    feature_dict['Day'] = float(req.Day_of_Month)
    
    dow_map = {'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6}
    feature_dict['Day_of_Week_Num'] = float(dow_map.get(req.Day_of_Week, 0))
    feature_dict['Is_Weekend'] = 1.0 if req.Day_of_Week in ['Saturday', 'Sunday'] else 0.0
    
    # Engineered features
    feature_dict['Net_Cash_Flow_Today'] = float(req.Total_Deposits - req.Total_Withdrawals)
    feature_dict['Withdrawal_to_Deposit_Ratio'] = float(req.Total_Withdrawals / (req.Total_Deposits + 1.0))
    feature_dict['Event_Or_Holiday'] = 1.0 if (req.Special_Event_Flag == 1 or req.Holiday_Flag == 1) else 0.0
    
    # Categorical one-hot features
    cat_mappings = {
        'Day_of_Week': req.Day_of_Week,
        'Time_of_Day': req.Time_of_Day,
        'Location_Type': req.Location_Type,
        'Weather_Condition': req.Weather_Condition
    }
    
    for cat_col, user_val in cat_mappings.items():
        dummy_col = f"{cat_col}_{user_val}"
        if dummy_col in feature_dict:
            feature_dict[dummy_col] = 1.0
            
    X_inference = pd.DataFrame([feature_dict])[feature_cols]
    X_inference_scaled = pd.DataFrame(scaler.transform(X_inference), columns=feature_cols)
    
    # Predictions
    ridge_pred = float(ridge_best.predict(X_inference_scaled)[0])
    rf_pred = float(rf_best.predict(X_inference)[0])
    gb_pred = float(gb_best.predict(X_inference)[0])
    
    weights = pipeline_meta.get('ensemble_weights', {'Ridge Regression': 0.33, 'Random Forest': 0.33, 'Gradient Boosting': 0.34})
    ensemble_pred = (
        weights.get('Ridge Regression', 0.33) * ridge_pred +
        weights.get('Random Forest', 0.33) * rf_pred +
        weights.get('Gradient Boosting', 0.34) * gb_pred
    )
    
    if best_model_name == 'Ridge Regression':
        pred_demand = ridge_pred
    elif best_model_name == 'Random Forest':
        pred_demand = rf_pred
    elif best_model_name == 'Gradient Boosting':
        pred_demand = gb_pred
    else:
        pred_demand = ensemble_pred
        
    pred_demand = max(0.0, round(pred_demand, 2))
    
    # Stockout risk classification probability
    if selected_cls_name == 'Logistic Regression':
        cls_prob = float(stockout_classifier.predict_proba(X_inference_scaled)[0, 1])
    else:
        cls_prob = float(stockout_classifier.predict_proba(X_inference)[0, 1])
        
    # Smart Dispatch Decision Engine
    dec = compute_refill_and_priority(
        pred_demand=pred_demand,
        current_cash=req.Previous_Day_Cash_Level,
        holiday_flag=req.Holiday_Flag,
        location_type=req.Location_Type,
        stockout_prob=cls_prob
    )
    
    return {
        "predicted_demand": pred_demand,
        "stockout_probability": round(cls_prob * 100, 2),
        "safety_buffer": dec['safety_buffer'],
        "target_cash": dec['target_cash'],
        "recommended_refill": dec['recommended_refill'],
        "priority_level": dec['priority_level'],
        "priority_score": dec['priority_score'],
        "best_model_used": best_model_name
    }
