import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from typing import Dict, Any, Tuple, List

def train_and_save_classifier(split_data: Dict[str, Any], models_dir: str) -> Tuple[List[Dict[str, Any]], np.ndarray]:
    """
    Trains and evaluates stockout risk classifiers (Logistic Regression, Random Forest, Gradient Boosting).
    Prioritizes Recall to ensure false-negative stockouts are minimized.
    Saves the optimal classifier binary to stockout_model.pkl and updates pipeline metadata.
    
    Returns:
    --------
    cls_metrics : list of dicts
        Evaluation metrics (Accuracy, Precision, Recall, F1-Score) for each model.
    best_cls_preds : np.ndarray
        Binary predictions from the selected optimal model on the test split.
    """
    os.makedirs(models_dir, exist_ok=True)
    
    X_train = split_data['X_train']
    X_test = split_data['X_test']
    X_train_scaled = split_data['X_train_scaled']
    X_test_scaled = split_data['X_test_scaled']
    y_train_cls = split_data['y_train_cls']
    y_test_cls = split_data['y_test_cls']
    
    # Check class distribution in train set
    pos_count = int((y_train_cls == 1).sum())
    neg_count = int((y_train_cls == 0).sum())
    print(f"  - Training Class Distribution: Non-Stockout: {neg_count}, Stockout: {pos_count}")
    
    # 1. Logistic Regression (with class weighting for imbalanced positive events)
    print("  - Training Logistic Regression Classifier...")
    lr_cls = LogisticRegression(class_weight='balanced', C=1.0, max_iter=1000, random_state=42)
    lr_cls.fit(X_train_scaled, y_train_cls)
    lr_preds = lr_cls.predict(X_test_scaled)
    
    lr_acc = accuracy_score(y_test_cls, lr_preds)
    lr_prec = precision_score(y_test_cls, lr_preds, zero_division=0)
    lr_rec = recall_score(y_test_cls, lr_preds, zero_division=0)
    lr_f1 = f1_score(y_test_cls, lr_preds, zero_division=0)
    print(f"    Logistic Regression -> Acc: {lr_acc*100:.2f}%, Prec: {lr_prec:.4f}, Recall: {lr_rec:.4f}, F1: {lr_f1:.4f}")
    
    # 2. Random Forest Classifier
    print("  - Training Random Forest Classifier...")
    rf_cls = RandomForestClassifier(n_estimators=100, class_weight='balanced', max_depth=10, random_state=42, n_jobs=-1)
    rf_cls.fit(X_train, y_train_cls)
    rf_preds = rf_cls.predict(X_test)
    
    rf_acc = accuracy_score(y_test_cls, rf_preds)
    rf_prec = precision_score(y_test_cls, rf_preds, zero_division=0)
    rf_rec = recall_score(y_test_cls, rf_preds, zero_division=0)
    rf_f1 = f1_score(y_test_cls, rf_preds, zero_division=0)
    print(f"    Random Forest -> Acc: {rf_acc*100:.2f}%, Prec: {rf_prec:.4f}, Recall: {rf_rec:.4f}, F1: {rf_f1:.4f}")
    
    # 3. Gradient Boosting Classifier
    print("  - Training Gradient Boosting Classifier...")
    gb_cls = GradientBoostingClassifier(n_estimators=100, learning_rate=0.05, max_depth=4, random_state=42)
    gb_cls.fit(X_train, y_train_cls)
    gb_preds = gb_cls.predict(X_test)
    
    gb_acc = accuracy_score(y_test_cls, gb_preds)
    gb_prec = precision_score(y_test_cls, gb_preds, zero_division=0)
    gb_rec = recall_score(y_test_cls, gb_preds, zero_division=0)
    gb_f1 = f1_score(y_test_cls, gb_preds, zero_division=0)
    print(f"    Gradient Boosting -> Acc: {gb_acc*100:.2f}%, Prec: {gb_prec:.4f}, Recall: {gb_rec:.4f}, F1: {gb_f1:.4f}")
    
    cls_metrics = [
        {
            'Classifier': 'Logistic Regression',
            'Accuracy': f"{lr_acc*100:.2f}%",
            'Precision': round(lr_prec, 4),
            'Recall': round(lr_rec, 4),
            'F1_Score': round(lr_f1, 4)
        },
        {
            'Classifier': 'Random Forest Classifier',
            'Accuracy': f"{rf_acc*100:.2f}%",
            'Precision': round(rf_prec, 4),
            'Recall': round(rf_rec, 4),
            'F1_Score': round(rf_f1, 4)
        },
        {
            'Classifier': 'Gradient Boosting Classifier',
            'Accuracy': f"{gb_acc*100:.2f}%",
            'Precision': round(gb_prec, 4),
            'Recall': round(gb_rec, 4),
            'F1_Score': round(gb_f1, 4)
        }
    ]
    
    # Selection: Prioritize highest Recall (safety priority for ATM cash logistics)
    # If equal recall, choose higher F1
    candidates = [
        ('Logistic Regression', lr_cls, lr_rec, lr_f1, lr_preds),
        ('Random Forest Classifier', rf_cls, rf_rec, rf_f1, rf_preds),
        ('Gradient Boosting Classifier', gb_cls, gb_rec, gb_f1, gb_preds)
    ]
    candidates_sorted = sorted(candidates, key=lambda x: (x[2], x[3]), reverse=True)
    selected_name, selected_model, best_recall, best_f1, best_preds = candidates_sorted[0]
    
    print(f"  - Selected Optimal Stockout Classifier: '{selected_name}' (Highest Recall: {best_recall:.4f})")
    
    # Save the selected model
    joblib.dump(selected_model, os.path.join(models_dir, 'stockout_model.pkl'))
    
    # Compute Confusion Matrix
    cm = confusion_matrix(y_test_cls, best_preds)
    cm_dict = {
        'tn': int(cm[0, 0]),
        'fp': int(cm[0, 1]),
        'fn': int(cm[1, 0]),
        'tp': int(cm[1, 1])
    }
    
    # Update pipeline metadata
    metadata_path = os.path.join(models_dir, 'pipeline_metadata.json')
    meta = {}
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, 'r') as f:
                meta = json.load(f)
        except Exception:
            meta = {}
            
    meta['selected_classifier_name'] = selected_name
    meta['classification_metrics'] = cls_metrics
    meta['classifier_confusion_matrix'] = cm_dict
    
    with open(metadata_path, 'w') as f:
        json.dump(meta, f, indent=4)
        
    return cls_metrics, best_preds
