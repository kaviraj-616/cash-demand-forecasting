import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from sklearn.metrics import confusion_matrix
from typing import List, Dict, Any

# Styling defaults
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['axes.edgecolor'] = '#CBD5E1'
plt.rcParams['axes.linewidth'] = 0.8

def plot_actual_vs_predicted(y_true, y_pred, model_name: str, output_dir: str):
    """
    Generates and saves Actual vs. Predicted Demand scatter plot.
    """
    os.makedirs(output_dir, exist_ok=True)
    fig, ax = plt.subplots(figsize=(8, 6), dpi=300)
    
    # Scatter plot
    ax.scatter(y_true, y_pred, alpha=0.4, color='#2563EB', edgecolors='none', s=25, label='ATM Observations')
    
    # Reference 45-degree ideal fit line
    min_val = min(min(y_true), min(y_pred))
    max_val = max(max(y_true), max(y_pred))
    ax.plot([min_val, max_val], [min_val, max_val], '--', color='#DC2626', linewidth=2, label='Ideal Perfect Fit (y = x)')
    
    ax.set_title(f"Actual vs. Predicted Cash Demand ({model_name})", fontsize=13, fontweight='bold', pad=12)
    ax.set_xlabel("Actual Next-Day Demand (₹)", fontsize=11, fontweight='semibold')
    ax.set_ylabel("Predicted Next-Day Demand (₹)", fontsize=11, fontweight='semibold')
    ax.legend(frameon=True, facecolor='white', framealpha=0.9)
    ax.grid(True, linestyle=':', alpha=0.6)
    
    plt.tight_layout()
    save_path = os.path.join(output_dir, 'actual_vs_predicted.png')
    plt.savefig(save_path)
    plt.close()
    print(f"  - Exported plot: {save_path}")

def plot_model_comparison(reg_metrics: List[Dict[str, Any]], output_dir: str):
    """
    Generates comparative bar chart for Regression Models (RMSE & R2 Score).
    """
    os.makedirs(output_dir, exist_ok=True)
    df_metrics = pd.DataFrame(reg_metrics)
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5), dpi=300)
    
    # Palette
    colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']
    
    # Plot 1: RMSE (Lower is better)
    bars1 = ax1.bar(df_metrics['Model'], df_metrics['RMSE'], color=colors[:len(df_metrics)], width=0.55)
    ax1.set_title("Root Mean Squared Error (RMSE - Lower is Better)", fontsize=11, fontweight='bold', pad=10)
    ax1.set_ylabel("RMSE (₹)", fontsize=10)
    ax1.tick_params(axis='x', rotation=15, labelsize=9)
    ax1.grid(axis='y', linestyle=':', alpha=0.6)
    
    for bar in bars1:
        yval = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2.0, yval + 50, f"₹{yval:,.0f}", ha='center', va='bottom', fontsize=8, fontweight='bold')
        
    # Plot 2: R2 Score (Higher is better)
    bars2 = ax2.bar(df_metrics['Model'], df_metrics['R2_Score'], color=colors[:len(df_metrics)], width=0.55)
    ax2.set_title("Coefficient of Determination (R² Score - Higher is Better)", fontsize=11, fontweight='bold', pad=10)
    ax2.set_ylabel("R² Score", fontsize=10)
    ax2.set_ylim([0.0, 1.0])
    ax2.tick_params(axis='x', rotation=15, labelsize=9)
    ax2.grid(axis='y', linestyle=':', alpha=0.6)
    
    for bar in bars2:
        yval = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2.0, yval + 0.02, f"{yval:.4f}", ha='center', va='bottom', fontsize=8, fontweight='bold')
        
    plt.suptitle("Comparative Regression Performance across Forecast Models", fontsize=13, fontweight='bold', y=1.02)
    plt.tight_layout()
    save_path = os.path.join(output_dir, 'model_comparison.png')
    plt.savefig(save_path, bbox_inches='tight')
    plt.close()
    print(f"  - Exported plot: {save_path}")

def plot_feature_importance(rf_importances: Dict[str, float], output_dir: str, top_n: int = 10):
    """
    Plots horizontal bar chart of top predictive features.
    """
    os.makedirs(output_dir, exist_ok=True)
    sorted_features = sorted(rf_importances.items(), key=lambda x: x[1], reverse=True)[:top_n]
    features, values = zip(*sorted_features)
    
    # Reverse for top-to-bottom display
    features = list(features)[::-1]
    values = list(values)[::-1]
    
    fig, ax = plt.subplots(figsize=(9, 6), dpi=300)
    bars = ax.barh(features, values, color='#4F46E5', height=0.6)
    
    ax.set_title(f"Top {top_n} Most Important Demand Predictors (Random Forest)", fontsize=12, fontweight='bold', pad=12)
    ax.set_xlabel("Relative Gini Importance Score", fontsize=10, fontweight='semibold')
    ax.grid(axis='x', linestyle=':', alpha=0.6)
    
    for bar in bars:
        width = bar.get_width()
        ax.text(width + 0.003, bar.get_y() + bar.get_height()/2.0, f"{width:.4f}", ha='left', va='center', fontsize=8, fontweight='bold', color='#1F2937')
        
    plt.tight_layout()
    save_path = os.path.join(output_dir, 'feature_importance.png')
    plt.savefig(save_path)
    plt.close()
    print(f"  - Exported plot: {save_path}")

def plot_confusion_matrix(y_true, y_pred, output_dir: str):
    """
    Generates and exports confusion matrix heatmap for stockout classification.
    """
    os.makedirs(output_dir, exist_ok=True)
    cm = confusion_matrix(y_true, y_pred)
    
    fig, ax = plt.subplots(figsize=(6, 5), dpi=300)
    sns.heatmap(
        cm,
        annot=True,
        fmt='d',
        cmap='Blues',
        cbar=False,
        xticklabels=['Adequate Cash (0)', 'Stockout Risk (1)'],
        yticklabels=['Adequate Cash (0)', 'Stockout Risk (1)'],
        ax=ax,
        annot_kws={"size": 13, "weight": "bold"}
    )
    
    ax.set_title("Stockout Risk Classification Confusion Matrix", fontsize=11, fontweight='bold', pad=12)
    ax.set_xlabel("Predicted Label", fontsize=10, fontweight='semibold')
    ax.set_ylabel("True Actual Label", fontsize=10, fontweight='semibold')
    
    plt.tight_layout()
    save_path = os.path.join(output_dir, 'confusion_matrix.png')
    plt.savefig(save_path)
    plt.close()
    print(f"  - Exported plot: {save_path}")
