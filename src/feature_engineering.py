import pandas as pd
import numpy as np

def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes domain-specific engineered features for ATM cash management.
    
    Features engineered:
    - Net_Cash_Flow_Today: Total Deposits minus Total Withdrawals.
    - Withdrawal_to_Deposit_Ratio: Ratio of withdrawal outflow to deposit inflow.
    - Event_Or_Holiday: Indicator if today is a holiday or special event day.
    """
    df = df.copy()
    
    # 1. Net Cash Flow Today (Deposits - Withdrawals)
    if 'Total_Deposits' in df.columns and 'Total_Withdrawals' in df.columns:
        df['Net_Cash_Flow_Today'] = df['Total_Deposits'] - df['Total_Withdrawals']
    else:
        df['Net_Cash_Flow_Today'] = 0.0
        
    # 2. Outflow to Inflow Ratio (Avoid division by zero by adding 1.0)
    if 'Total_Withdrawals' in df.columns and 'Total_Deposits' in df.columns:
        df['Withdrawal_to_Deposit_Ratio'] = df['Total_Withdrawals'] / (df['Total_Deposits'] + 1.0)
    else:
        df['Withdrawal_to_Deposit_Ratio'] = 0.0
        
    # 3. Combined Surge Flag (Holiday or Special Event)
    h_flag = df['Holiday_Flag'] if 'Holiday_Flag' in df.columns else 0
    e_flag = df['Special_Event_Flag'] if 'Special_Event_Flag' in df.columns else 0
    df['Event_Or_Holiday'] = ((h_flag == 1) | (e_flag == 1)).astype(int)
    
    return df
