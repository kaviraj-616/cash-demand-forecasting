import os
import json
import pandas as pd
import numpy as np

# Import modules from src
from src.data_loader import load_dataset
from src.preprocessing import (
    check_duplicates_and_missing,
    clean_data_types,
    parse_date_features,
    build_features_and_targets,
    split_and_scale
)
from src.feature_engineering import add_engineered_features
from src.train_models import train_and_save_regression_models
from src.stockout_model import train_and_save_classifier
from src.decision_engine import process_dispatch_decisions
from src.evaluate_models import (
    plot_actual_vs_predicted,
    plot_model_comparison,
    plot_feature_importance,
    plot_confusion_matrix
)

def run_pipeline():
    print("="*80)
    # Refined title using correct terminology
    print("   ATM CASH DEMAND FORECASTING & SMART DISPATCH DECISION ENGINE PIPELINE   ")
    print("="*80)
    
    models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')
    outputs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'outputs')
    plots_dir = os.path.join(outputs_dir, 'plots')
    metrics_dir = os.path.join(outputs_dir, 'metrics')
    
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(plots_dir, exist_ok=True)
    os.makedirs(metrics_dir, exist_ok=True)
    
    # 1. Load Data
    print("\n[Step 1] Loading Dataset...")
    df = load_dataset()
    print(f"  - Loaded dataset with shape: {df.shape}")
    
    # 2. Data Cleaning & Preprocessing
    print("\n[Step 2] Cleaning & Preprocessing Data...")
    df = check_duplicates_and_missing(df)
    df = clean_data_types(df)
    df = parse_date_features(df)
    
    # 3. Feature Engineering
    print("\n[Step 3] Running Feature Engineering...")
    df = add_engineered_features(df)
    print(f"  - Features processed. Total columns: {df.shape[1]}")
    
    # 4. Separate Target & Features
    print("\n[Step 4] Building Feature Matrix and Target Arrays...")
    X, y_reg, y_cls, cat_categories = build_features_and_targets(df)
    
    # Save categorical encoding metadata so backend/FastAPI can use the same dummy columns
    # and reindexing layout during user "What-If" scenario submissions.
    with open(os.path.join(models_dir, 'categorical_metadata.json'), 'w') as f:
        json.dump({
            'categorical_categories': cat_categories,
            'feature_columns': list(X.columns)
        }, f, indent=4)
        
    print(f"  - Features: {X.shape[1]} columns. Saved encoding metadata.")
    
    # 5. Chronological Train-Test Split and Scaling
    print("\n[Step 5] Performing Chronological Split & Feature Scaling...")
    # Earlier 80% to train, later 20% to test
    split_data = split_and_scale(X, y_reg, y_cls, train_size=0.8)
    print(f"  - Training features shape: {split_data['X_train'].shape}")
    print(f"  - Testing features shape: {split_data['X_test'].shape}")
    
    # 6. Train Regression Models (Ridge, Random Forest, Gradient Boosting, Ensemble)
    print("\n[Step 6] Tuning & Training Regression Models (Cash Demand Forecasting)...")
    reg_metrics, regression_metadata = train_and_save_regression_models(split_data, models_dir)
    
    # Save regression metrics CSV
    pd.DataFrame(reg_metrics).to_csv(os.path.join(metrics_dir, 'regression_metrics.csv'), index=False)
    print("  - Saved regression metrics.")
    
    # 7. Train Classification Models (Stockout Risk Prediction)
    print("\n[Step 7] Tuning & Training Stockout Classifiers...")
    cls_metrics, best_cls_preds = train_and_save_classifier(split_data, models_dir)
    
    # Save classification metrics CSV
    pd.DataFrame(cls_metrics).to_csv(os.path.join(metrics_dir, 'classification_metrics.csv'), index=False)
    print("  - Saved classification metrics.")
    
    # Get predictions for best regression model to compare and run decision engine
    best_model_name = regression_metadata['best_model_name']
    
    # Load model outputs
    import joblib
    ridge_best = joblib.load(os.path.join(models_dir, 'ridge_model.pkl'))
    rf_best = joblib.load(os.path.join(models_dir, 'random_forest_model.pkl'))
    gb_best = joblib.load(os.path.join(models_dir, 'gradient_boosting_model.pkl'))
    scaler = joblib.load(os.path.join(models_dir, 'ensemble_scaler.pkl'))
    
    # Re-evaluate predictions on test set for generating graphs
    ridge_preds = ridge_best.predict(split_data['X_test_scaled'])
    rf_preds = rf_best.predict(split_data['X_test'])
    gb_preds = gb_best.predict(split_data['X_test'])
    
    # Reconstruct ensemble preds
    weights = regression_metadata['ensemble_weights']
    ensemble_preds = (
        weights['Ridge Regression'] * ridge_preds +
        weights['Random Forest'] * rf_preds +
        weights['Gradient Boosting'] * gb_preds
    )
    
    # Map predictions to best model
    if best_model_name == 'Ridge Regression':
        best_reg_preds = ridge_preds
    elif best_model_name == 'Random Forest':
        best_reg_preds = rf_preds
    elif best_model_name == 'Gradient Boosting':
        best_reg_preds = gb_preds
    else:
        best_reg_preds = ensemble_preds # Default to ensemble
        
    # Get best stockout probabilities from the classification model
    stockout_classifier = joblib.load(os.path.join(models_dir, 'stockout_model.pkl'))
    # Handle Logistic Regression vs Tree models (some require scaled inputs)
    with open(os.path.join(models_dir, 'pipeline_metadata.json'), 'r') as f:
        pipeline_meta = json.load(f)
    selected_cls_name = pipeline_meta['selected_classifier_name']
    if selected_cls_name == 'Logistic Regression':
        best_cls_probs = stockout_classifier.predict_proba(split_data['X_test_scaled'])[:, 1]
    else:
        best_cls_probs = stockout_classifier.predict_proba(split_data['X_test'])[:, 1]
        
    # 8. Run Decision Engine
    print("\n[Step 8] Running Dispatch Decision Engine on Test Set...")
    # Get original test rows from df using indices
    test_df = df.loc[split_data['test_indices']].copy()
    ranked_test_decisions = process_dispatch_decisions(
        test_df=test_df,
        reg_preds=best_reg_preds,
        cls_probs=best_cls_probs
    )
    
    # Save sample decision dashboard output to verification folder
    ranked_test_decisions.to_csv(os.path.join(metrics_dir, 'dispatch_decisions.csv'), index=False)
    print("  - Generated dispatch decisions database.")
    
    # 9. Generate Verification Visualizations
    print("\n[Step 9] Creating Output Performance Charts...")
    
    # Plot 1: Actual vs Predicted (for best regressor)
    plot_actual_vs_predicted(
        y_true=split_data['y_test_reg'],
        y_pred=best_reg_preds,
        model_name=best_model_name,
        output_dir=plots_dir
    )
    
    # Plot 2: Model Comparison (RMSE & R2)
    plot_model_comparison(reg_metrics, plots_dir)
    
    # Plot 3: Feature Importance (using Random Forest Regressor by default)
    # Fetch importances from the metadata
    rf_importances = regression_metadata['feature_importance_rf']
    plot_feature_importance(rf_importances, plots_dir, top_n=10)
    
    # Plot 4: Confusion Matrix
    plot_confusion_matrix(
        y_true=split_data['y_test_cls'],
        y_pred=best_cls_preds,
        output_dir=plots_dir
    )
    
    print("\n" + "="*80)
    print("                     PIPELINE COMPLETED SUCCESSFULLY!                     ")
    print(f"  All models saved in: {models_dir}")
    print(f"  Plots exported to:  {plots_dir}")
    print(f"  Metrics exported to: {metrics_dir}")
    print("="*80)

if __name__ == '__main__':
    run_pipeline()
