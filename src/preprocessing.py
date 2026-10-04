import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from typing import Tuple, Dict, Any, List

def check_duplicates_and_missing(df: pd.DataFrame) -> pd.DataFrame:
    """
    Checks for and handles duplicates and missing values in the dataset.
    """
    df = df.copy()
    
    # 1. Handle missing values
    num_cols = df.select_dtypes(include=[np.number]).columns
    for col in num_cols:
        if df[col].isnull().sum() > 0:
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)
            print(f"  - Imputed missing values in '{col}' with median: {median_val}")
            
    cat_cols = df.select_dtypes(include=['object', 'category', 'string', 'str']).columns
    for col in cat_cols:
        if df[col].isnull().sum() > 0:
            mode_series = df[col].mode()
            mode_val = mode_series[0] if len(mode_series) > 0 else ''
            df[col] = df[col].fillna(mode_val)
            print(f"  - Imputed missing values in '{col}' with mode: {mode_val}")

    # 2. Remove duplicate rows if any
    initial_len = len(df)
    df = df.drop_duplicates().reset_index(drop=True)
    dropped_dups = initial_len - len(df)
    if dropped_dups > 0:
        print(f"  - Dropped {dropped_dups} duplicate records.")
            
    return df

def clean_data_types(df: pd.DataFrame) -> pd.DataFrame:
    """
    Enforces standardized data types across columns.
    """
    df = df.copy()
    
    numeric_columns = [
        'Total_Withdrawals', 'Total_Deposits', 'Previous_Day_Cash_Level',
        'Nearby_Competitor_ATMs', 'Holiday_Flag', 'Special_Event_Flag'
    ]
    if 'Cash_Demand_Next_Day' in df.columns:
        numeric_columns.append('Cash_Demand_Next_Day')
        
    for col in numeric_columns:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            
    # String columns
    str_cols = ['ATM_ID', 'Day_of_Week', 'Time_of_Day', 'Location_Type', 'Weather_Condition']
    for col in str_cols:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()
            
    return df

def parse_date_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Parses date column and extracts calendar attributes.
    """
    df = df.copy()
    
    if 'Date' in df.columns:
        date_series = pd.to_datetime(df['Date'], errors='coerce')
        df['Month'] = date_series.dt.month.fillna(1).astype(int)
        df['Day'] = date_series.dt.day.fillna(1).astype(int)
        
        # Day of week mapping (Monday=0, Sunday=6)
        dow_map = {
            'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
            'Friday': 4, 'Saturday': 5, 'Sunday': 6
        }
        if 'Day_of_Week' in df.columns:
            df['Day_of_Week_Num'] = df['Day_of_Week'].map(dow_map).fillna(date_series.dt.dayofweek).fillna(0).astype(int)
        else:
            df['Day_of_Week_Num'] = date_series.dt.dayofweek.fillna(0).astype(int)
            
        df['Is_Weekend'] = df['Day_of_Week_Num'].apply(lambda x: 1 if x in [5, 6] else 0)
    else:
        # Fallback defaults if date missing
        df['Month'] = 1
        df['Day'] = 1
        df['Day_of_Week_Num'] = 0
        df['Is_Weekend'] = 0
        
    return df

def build_features_and_targets(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series, pd.Series, Dict[str, List[str]]]:
    """
    Builds the numerical feature matrix X, regression target y_reg,
    and stockout classification target y_cls.
    
    Returns:
    --------
    X : pd.DataFrame
        One-hot encoded feature matrix.
    y_reg : pd.Series
        Next-day cash demand target.
    y_cls : pd.Series
        Binary stockout target (1 = stockout, 0 = no stockout).
    cat_categories : dict
        Mapping of categorical features and their distinct categories for inference.
    """
    df = df.copy()
    
    # Regression target
    if 'Cash_Demand_Next_Day' not in df.columns:
        raise KeyError("Column 'Cash_Demand_Next_Day' not found in dataset.")
    y_reg = df['Cash_Demand_Next_Day'].astype(float)
    
    # Classification target: Stockout occurs when Next Day Demand exceeds Previous Day Cash Level
    y_cls = (df['Cash_Demand_Next_Day'] > df['Previous_Day_Cash_Level']).astype(int)
    
    # Categorical columns to encode
    cat_cols = ['Day_of_Week', 'Time_of_Day', 'Location_Type', 'Weather_Condition']
    existing_cat_cols = [c for c in cat_cols if c in df.columns]
    
    cat_categories = {}
    for c in existing_cat_cols:
        cat_categories[c] = sorted(list(df[c].dropna().unique()))
        
    # Numerical & engineered feature columns to keep directly
    numeric_feature_cols = [
        'Previous_Day_Cash_Level',
        'Holiday_Flag',
        'Special_Event_Flag',
        'Nearby_Competitor_ATMs',
        'Month',
        'Day',
        'Day_of_Week_Num',
        'Is_Weekend',
        'Net_Cash_Flow_Today',
        'Withdrawal_to_Deposit_Ratio',
        'Event_Or_Holiday'
    ]
    
    available_num_cols = [c for c in numeric_feature_cols if c in df.columns]
    X_num = df[available_num_cols].astype(float)
    
    # One-hot encode categorical features
    X_cat = pd.get_dummies(df[existing_cat_cols], columns=existing_cat_cols, dtype=float)
    
    # Combine features
    X = pd.concat([X_num, X_cat], axis=1)
    
    return X, y_reg, y_cls, cat_categories

def split_and_scale(
    X: pd.DataFrame,
    y_reg: pd.Series,
    y_cls: pd.Series,
    train_size: float = 0.8
) -> Dict[str, Any]:
    """
    Performs chronological train/test split (earliest 80% train, latest 20% test)
    and fits StandardScaler strictly on the training set to prevent data leakage.
    """
    n_samples = len(X)
    split_idx = int(n_samples * train_size)
    
    train_indices = X.index[:split_idx]
    test_indices = X.index[split_idx:]
    
    X_train = X.iloc[:split_idx].copy()
    X_test = X.iloc[split_idx:].copy()
    
    y_train_reg = y_reg.iloc[:split_idx].copy()
    y_test_reg = y_reg.iloc[split_idx:].copy()
    
    y_train_cls = y_cls.iloc[:split_idx].copy()
    y_test_cls = y_cls.iloc[split_idx:].copy()
    
    # Fit scaler strictly on training split
    scaler = StandardScaler()
    X_train_scaled_arr = scaler.fit_transform(X_train)
    X_test_scaled_arr = scaler.transform(X_test)
    
    X_train_scaled = pd.DataFrame(X_train_scaled_arr, columns=X.columns, index=X_train.index)
    X_test_scaled = pd.DataFrame(X_test_scaled_arr, columns=X.columns, index=X_test.index)
    
    return {
        'X_train': X_train,
        'X_test': X_test,
        'X_train_scaled': X_train_scaled,
        'X_test_scaled': X_test_scaled,
        'y_train_reg': y_train_reg,
        'y_test_reg': y_test_reg,
        'y_train_cls': y_train_cls,
        'y_test_cls': y_test_cls,
        'train_indices': train_indices,
        'test_indices': test_indices,
        'scaler': scaler
    }
