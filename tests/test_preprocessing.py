import pytest
import pandas as pd
import numpy as np
from src.preprocessing import (
    check_duplicates_and_missing,
    clean_data_types,
    parse_date_features,
    build_features_and_targets,
    split_and_scale
)
from src.feature_engineering import add_engineered_features

@pytest.fixture
def sample_raw_dataframe():
    data = {
        'ATM_ID': ['ATM_001', 'ATM_002', 'ATM_003', 'ATM_004', 'ATM_005'],
        'Date': ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05'],
        'Day_of_Week': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        'Time_of_Day': ['Morning', 'Afternoon', 'Evening', 'Night', 'Morning'],
        'Total_Withdrawals': [50000, 30000, 45000, 20000, 60000],
        'Total_Deposits': [10000, 15000, 5000, 20000, 8000],
        'Location_Type': ['Standalone', 'Mall', 'Supermarket', 'Bank Branch', 'Gas Station'],
        'Holiday_Flag': [1, 0, 0, 0, 0],
        'Special_Event_Flag': [0, 0, 1, 0, 0],
        'Previous_Day_Cash_Level': [100000, 80000, 40000, 90000, 50000],
        'Weather_Condition': ['Clear', 'Cloudy', 'Rainy', 'Snowy', 'Clear'],
        'Nearby_Competitor_ATMs': [2, 1, 4, 0, 3],
        'Cash_Demand_Next_Day': [48000, 32000, 55000, 18000, 62000]
    }
    return pd.DataFrame(data)

def test_check_duplicates_and_missing(sample_raw_dataframe):
    # Introduce duplicate row and a missing value in a separate column
    duplicate_row = sample_raw_dataframe.iloc[1:2]
    df_with_issues = pd.concat([sample_raw_dataframe, duplicate_row], ignore_index=True)
    df_with_issues.loc[4, 'Nearby_Competitor_ATMs'] = np.nan
    
    cleaned = check_duplicates_and_missing(df_with_issues)
    assert len(cleaned) == 5
    assert not cleaned['Nearby_Competitor_ATMs'].isnull().any()

def test_parse_date_features(sample_raw_dataframe):
    parsed = parse_date_features(sample_raw_dataframe)
    assert 'Month' in parsed.columns
    assert 'Day' in parsed.columns
    assert 'Day_of_Week_Num' in parsed.columns
    assert 'Is_Weekend' in parsed.columns
    # 2023-01-01 is Sunday -> Is_Weekend should be 1
    assert parsed.loc[0, 'Is_Weekend'] == 1
    # 2023-01-02 is Monday -> Is_Weekend should be 0
    assert parsed.loc[1, 'Is_Weekend'] == 0

def test_add_engineered_features(sample_raw_dataframe):
    engineered = add_engineered_features(sample_raw_dataframe)
    assert 'Net_Cash_Flow_Today' in engineered.columns
    assert 'Withdrawal_to_Deposit_Ratio' in engineered.columns
    assert 'Event_Or_Holiday' in engineered.columns
    
    # Net cash flow = Deposits (10000) - Withdrawals (50000) = -40000
    assert engineered.loc[0, 'Net_Cash_Flow_Today'] == -40000
    # Event_Or_Holiday for row 0 (Holiday_Flag=1) -> 1
    assert engineered.loc[0, 'Event_Or_Holiday'] == 1
    # Event_Or_Holiday for row 2 (Special_Event_Flag=1) -> 1
    assert engineered.loc[2, 'Event_Or_Holiday'] == 1
    # Event_Or_Holiday for row 1 (no holiday/event) -> 0
    assert engineered.loc[1, 'Event_Or_Holiday'] == 0

def test_build_features_and_targets(sample_raw_dataframe):
    df = parse_date_features(sample_raw_dataframe)
    df = add_engineered_features(df)
    X, y_reg, y_cls, cat_meta = build_features_and_targets(df)
    
    assert 'Cash_Demand_Next_Day' not in X.columns
    assert 'Actual_Stockout' not in X.columns
    assert len(y_reg) == len(df)
    assert len(y_cls) == len(df)
    # Row 2: Demand (55000) > PrevCash (40000) -> Stockout = 1
    assert y_cls.iloc[2] == 1
    # Row 0: Demand (48000) <= PrevCash (100000) -> Stockout = 0
    assert y_cls.iloc[0] == 0

def test_split_and_scale(sample_raw_dataframe):
    df = parse_date_features(sample_raw_dataframe)
    df = add_engineered_features(df)
    X, y_reg, y_cls, _ = build_features_and_targets(df)
    
    split_data = split_and_scale(X, y_reg, y_cls, train_size=0.8)
    assert 'X_train' in split_data
    assert 'X_test' in split_data
    assert 'X_train_scaled' in split_data
    assert 'X_test_scaled' in split_data
    assert len(split_data['X_train']) == 4
    assert len(split_data['X_test']) == 1
