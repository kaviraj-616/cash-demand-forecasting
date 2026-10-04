import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
from typing import Dict, Any, Tuple, List

def train_and_save_regression_models(split_data: Dict[str, Any], models_dir: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Trains and tunes Ridge Regression, Random Forest Regressor, and Gradient Boosting Regressor.
    Assembles an inverse-RMSE weighted ensemble model.
    Saves models and scaler binaries into models_dir.
    
    Returns:
    --------
    reg_metrics : list of dicts
        Performance metrics (MAE, RMSE, R2 Score) for all models.
    regression_metadata : dict
        Metadata including best model name, weights, and feature importances.
    """
    os.makedirs(models_dir, exist_ok=True)
    
    X_train = split_data['X_train']
    X_test = split_data['X_test']
    X_train_scaled = split_data['X_train_scaled']
    X_test_scaled = split_data['X_test_scaled']
    y_train_reg = split_data['y_train_reg']
    y_test_reg = split_data['y_test_reg']
    scaler = split_data['scaler']
    
    # Save the fitted scaler
    joblib.dump(scaler, os.path.join(models_dir, 'ensemble_scaler.pkl'))
    print("  - Saved ensemble scaler.")
    
    # 1. Ridge Regression (uses scaled data)
    print("  - Tuning Ridge Regression...")
    ridge_grid = GridSearchCV(
        Ridge(),
        param_grid={'alpha': [0.01, 0.1, 1.0, 10.0, 50.0, 100.0, 500.0]},
        cv=3,
        scoring='neg_mean_squared_error',
        n_jobs=-1
    )
    ridge_grid.fit(X_train_scaled, y_train_reg)
    ridge_best = ridge_grid.best_estimator_
    joblib.dump(ridge_best, os.path.join(models_dir, 'ridge_model.pkl'))
    
    ridge_preds = ridge_best.predict(X_test_scaled)
    ridge_mae = mean_absolute_error(y_test_reg, ridge_preds)
    ridge_rmse = root_mean_squared_error(y_test_reg, ridge_preds)
    ridge_r2 = r2_score(y_test_reg, ridge_preds)
    print(f"    Ridge Best Alpha: {ridge_grid.best_params_['alpha']} -> MAE: {ridge_mae:.2f}, RMSE: {ridge_rmse:.2f}, R2: {ridge_r2:.4f}")
    
    # 2. Random Forest Regressor
    print("  - Tuning Random Forest Regressor...")
    rf_grid = GridSearchCV(
        RandomForestRegressor(random_state=42),
        param_grid={
            'n_estimators': [50, 100],
            'max_depth': [10, 15, 20],
            'min_samples_split': [2, 5]
        },
        cv=3,
        scoring='neg_mean_squared_error',
        n_jobs=-1
    )
    rf_grid.fit(X_train, y_train_reg)
    rf_best = rf_grid.best_estimator_
    joblib.dump(rf_best, os.path.join(models_dir, 'random_forest_model.pkl'))
    
    rf_preds = rf_best.predict(X_test)
    rf_mae = mean_absolute_error(y_test_reg, rf_preds)
    rf_rmse = root_mean_squared_error(y_test_reg, rf_preds)
    rf_r2 = r2_score(y_test_reg, rf_preds)
    print(f"    RF Best Params: {rf_grid.best_params_} -> MAE: {rf_mae:.2f}, RMSE: {rf_rmse:.2f}, R2: {rf_r2:.4f}")
    
    # 3. Gradient Boosting Regressor
    print("  - Tuning Gradient Boosting Regressor...")
    gb_grid = GridSearchCV(
        GradientBoostingRegressor(random_state=42),
        param_grid={
            'n_estimators': [50, 100],
            'learning_rate': [0.05, 0.1],
            'max_depth': [3, 5]
        },
        cv=3,
        scoring='neg_mean_squared_error',
        n_jobs=-1
    )
    gb_grid.fit(X_train, y_train_reg)
    gb_best = gb_grid.best_estimator_
    joblib.dump(gb_best, os.path.join(models_dir, 'gradient_boosting_model.pkl'))
    
    gb_preds = gb_best.predict(X_test)
    gb_mae = mean_absolute_error(y_test_reg, gb_preds)
    gb_rmse = root_mean_squared_error(y_test_reg, gb_preds)
    gb_r2 = r2_score(y_test_reg, gb_preds)
    print(f"    GB Best Params: {gb_grid.best_params_} -> MAE: {gb_mae:.2f}, RMSE: {gb_rmse:.2f}, R2: {gb_r2:.4f}")
    
    # 4. Weighted Ensemble Assembly (Weighted inversely by RMSE)
    inv_ridge = 1.0 / (ridge_rmse + 1e-6)
    inv_rf = 1.0 / (rf_rmse + 1e-6)
    inv_gb = 1.0 / (gb_rmse + 1e-6)
    total_inv = inv_ridge + inv_rf + inv_gb
    
    w_ridge = round(inv_ridge / total_inv, 4)
    w_rf = round(inv_rf / total_inv, 4)
    w_gb = round(1.0 - w_ridge - w_rf, 4)
    
    ensemble_weights = {
        'Ridge Regression': w_ridge,
        'Random Forest': w_rf,
        'Gradient Boosting': w_gb
    }
    
    ensemble_preds = (
        w_ridge * ridge_preds +
        w_rf * rf_preds +
        w_gb * gb_preds
    )
    
    ens_mae = mean_absolute_error(y_test_reg, ensemble_preds)
    ens_rmse = root_mean_squared_error(y_test_reg, ensemble_preds)
    ens_r2 = r2_score(y_test_reg, ensemble_preds)
    print(f"    Ensemble Weights: {ensemble_weights} -> MAE: {ens_mae:.2f}, RMSE: {ens_rmse:.2f}, R2: {ens_r2:.4f}")
    
    # Summary of metrics
    reg_metrics = [
        {
            'Model': 'Ridge Regression',
            'MAE': round(ridge_mae, 2),
            'RMSE': round(ridge_rmse, 2),
            'R2_Score': round(ridge_r2, 4)
        },
        {
            'Model': 'Random Forest Regressor',
            'MAE': round(rf_mae, 2),
            'RMSE': round(rf_rmse, 2),
            'R2_Score': round(rf_r2, 4)
        },
        {
            'Model': 'Gradient Boosting Regressor',
            'MAE': round(gb_mae, 2),
            'RMSE': round(gb_rmse, 2),
            'R2_Score': round(gb_r2, 4)
        },
        {
            'Model': 'Ensemble Model (Weighted)',
            'MAE': round(ens_mae, 2),
            'RMSE': round(ens_rmse, 2),
            'R2_Score': round(ens_r2, 4)
        }
    ]
    
    # Determine best model by highest R2 / lowest RMSE
    sorted_models = sorted(reg_metrics, key=lambda x: (x['RMSE'], -x['R2_Score']))
    best_model_name = sorted_models[0]['Model']
    if 'Ensemble' in best_model_name:
        best_model_name = 'Ensemble Model'
    elif 'Ridge' in best_model_name:
        best_model_name = 'Ridge Regression'
    elif 'Random Forest' in best_model_name:
        best_model_name = 'Random Forest'
    elif 'Gradient Boosting' in best_model_name:
        best_model_name = 'Gradient Boosting'
        
    # Feature Importances from RF
    feature_importance_rf = {
        col: float(imp)
        for col, imp in sorted(zip(X_train.columns, rf_best.feature_importances_), key=lambda x: x[1], reverse=True)
    }
    
    regression_metadata = {
        'best_model_name': best_model_name,
        'ensemble_weights': ensemble_weights,
        'feature_importance_rf': feature_importance_rf,
        'tuning_parameters': {
            'Ridge': ridge_grid.best_params_,
            'Random Forest': rf_grid.best_params_,
            'Gradient Boosting': gb_grid.best_params_
        },
        'regression_metrics': reg_metrics
    }
    
    # Update pipeline_metadata.json
    metadata_path = os.path.join(models_dir, 'pipeline_metadata.json')
    meta = {}
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, 'r') as f:
                meta = json.load(f)
        except Exception:
            meta = {}
            
    meta.update(regression_metadata)
    with open(metadata_path, 'w') as f:
        json.dump(meta, f, indent=4)
        
    return reg_metrics, regression_metadata
