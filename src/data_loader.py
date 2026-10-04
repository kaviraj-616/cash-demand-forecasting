import os
import pandas as pd

def load_dataset(filepath=None) -> pd.DataFrame:
    """
    Loads the ATM cash management dataset from disk.
    
    Parameters:
    -----------
    filepath : str, optional
        Custom path to the CSV file. If None, resolves the default dataset path
        relative to the project root directory.
        
    Returns:
    --------
    pd.DataFrame
        Loaded raw dataset as a Pandas DataFrame.
    """
    if filepath is None:
        # Resolve project root dynamically (two levels up from this file or relative to CWD)
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        default_path = os.path.join(base_dir, 'data', 'atm_cash_management_dataset.csv')
        filepath = default_path

    if not os.path.exists(filepath):
        # Fallback to checking cwd/data
        alt_path = os.path.join(os.getcwd(), 'data', 'atm_cash_management_dataset.csv')
        if os.path.exists(alt_path):
            filepath = alt_path
        else:
            raise FileNotFoundError(
                f"Dataset not found at expected path: '{filepath}'. "
                f"Please ensure 'atm_cash_management_dataset.csv' exists in the 'data/' directory."
            )

    df = pd.read_csv(filepath)
    return df
