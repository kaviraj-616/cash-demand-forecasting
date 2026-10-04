# ATM Cash Demand Forecasting & Smart Dispatch Decision Engine

> **A Machine Learning Project-Based Learning (PBL) Project**  
> Developed by Second-Year B.Tech Artificial Intelligence & Data Science Students

---

## 1. Problem Statement
Automated Teller Machines (ATMs) represent a vital cash distribution channel for banking institutions. However, maintaining optimal liquidity across distributed ATM networks poses a dual operational dilemma:
1. **Cash Outages (Stockouts):** Underestimating customer demand leads to empty ATMs, resulting in customer dissatisfaction, diminished brand trust, and service disruptions.
2. **Excess Cash Deposition:** Over-allocating cash ties up expensive capital, increases insurance premiums, and raises security liabilities.

This project delivers an end-to-end Machine Learning pipeline that predicts **next-day cash demand** (`Cash_Demand_Next_Day`) and classifies **stockout risks** (`Stockout Risk`), translating raw mathematical predictions into actionable replenishment decisions and priority queues.

---

## 2. Objectives
- **Demand Forecasting (Regression):** Predict daily ATM cash consumption accurately using historical, calendar, and environmental attributes.
- **Stockout Risk Warning (Classification):** Detect ATMs likely to run out of cash, prioritizing **Recall** to minimize false-negative outages.
- **Dynamic Replenishment Engine:** Compute variable safety buffers rather than rigid static multipliers.
- **Priority Dispatch Center:** Rank ATMs into operational tiers (**HIGH**, **MEDIUM**, **LOW**) for cash replenishment teams.
- **Interactive UI Simulation:** Provide an academic dashboard for exploratory analysis, model evaluation, and scenario what-if simulations.

---

## 3. Dataset Description
The model is trained on `atm_cash_management_dataset.csv` containing **5,658** historical observation records across distinct ATM terminals.

### Core Features:
- **Numerical:**
  - `Previous_Day_Cash_Level`: Current cash inside the machine ($₹$).
  - `Total_Withdrawals`: Total outflow of cash during observation.
  - `Total_Deposits`: Inflow of deposited funds.
  - `Nearby_Competitor_ATMs`: Surrounding competition density.
  - `Holiday_Flag` & `Special_Event_Flag`: Binary indicators for holidays/events.
- **Categorical:**
  - `Day_of_Week`: Monday through Sunday.
  - `Time_of_Day`: Morning, Afternoon, Evening, Night.
  - `Location_Type`: Standalone, Supermarket, Mall, Gas Station, Bank Branch.
  - `Weather_Condition`: Clear, Cloudy, Rainy, Snowy.
- **Engineered Features:**
  - `Month`, `Day`, `Day_of_Week_Num`, `Is_Weekend`
  - `Net_Cash_Flow_Today` = `Total_Deposits` - `Total_Withdrawals`
  - `Withdrawal_to_Deposit_Ratio` = `Total_Withdrawals` / (`Total_Deposits` + 1)
  - `Event_Or_Holiday` = Flag indicating surge demand periods.

---

## 4. Machine Learning Methodology

```text
Raw Dataset (5,658 rows)
         ↓
Data Validation & Cleaning (Check duplicates & missing values)
         ↓
Temporal & Transaction Feature Engineering
         ↓
Chronological Train/Test Split (Earliest 80% Train, Latest 20% Test)
         ↓
Feature Scaling (StandardScaler fitted strictly on training data)
         ↓
GridSearchCV 3-Fold Tuning & Model Evaluation
         ↓
Weighted Ensemble Assembly
         ↓
Stockout Classification (Logistic Regression / RF / GB - Recall Focus)
         ↓
Dynamic Safety Buffer & Decision Engine Dispatch Ranking
         ↓
FastAPI Backend & React Dashboard
```

### Preventing Data Leakage
- Chronological ordering is preserved: future rows are never exposed during model training.
- The target variables (`Cash_Demand_Next_Day` and `Actual_Stockout`) are strictly excluded from feature matrix $X$.
- All scalers and encoders are fitted solely on training splits.

---

## 5. Model Performance & Evaluation

### Regression Models (Demand Forecasting)
Evaluated on the unseen test set ($1,132$ records):

| Model | MAE ($₹$) | RMSE ($₹$) | $R^2$ Score |
| :--- | :---: | :---: | :---: |
| **Ridge Regression** | **5,152.81** | **6,226.17** | **0.8570** |
| Random Forest Regressor | 5,252.41 | 6,365.85 | 0.8506 |
| Gradient Boosting Regressor | 5,179.62 | 6,285.82 | 0.8543 |
| Ensemble Model (Weighted) | 5,162.16 | 6,251.90 | 0.8559 |

*Result:* Ridge Regression and the Weighted Ensemble exhibited strong predictive power, accounting for $\sim 85.7\%$ of variance in next-day demand.

### Classification Models (Stockout Risk Prediction)
Evaluated on positive cash depletion occurrences:

| Classifier | Accuracy | Precision | Recall | F1-Score |
| :--- | :---: | :---: | :---: | :---: |
| **Logistic Regression** | **99.20%** | **0.6667** | **0.6154** | **0.6400** |
| Random Forest Classifier | 99.03% | 1.0000 | 0.1538 | 0.2667 |
| Gradient Boosting Classifier | 99.03% | 0.6250 | 0.3846 | 0.4762 |

*Why Prioritize Recall?*  
In automated teller logistics, a **False Negative** (failing to detect an impending stockout) is operationally disruptive and costly. **Logistic Regression** achieved the highest recall ($0.6154$) while maintaining $99.20\%$ accuracy.

---

## 6. Smart Dispatch Decision Engine

Rather than relying on a static $15\%$ buffer, the system implements a dynamic formulation:

$$\text{Total Buffer \%} = 10\% \text{ (Base)} + 5\% \text{ (Holiday)} + 5\% \text{ (High Volatility Location)} + (\text{Stockout Prob} \times 10\%)$$

$$\text{Target Cash} = \text{Predicted Demand} + \text{Safety Buffer}$$

$$\text{Recommended Refill} = \max(0, \text{Target Cash} - \text{Current Cash})$$

$$\text{Priority Score} = (\text{Stockout Prob} \times 0.6) + (\text{Deficit Ratio} \times 0.4)$$

---

## 7. Project Structure

```text
M:\ml project\
├── data/
│   └── atm_cash_management_dataset.csv
├── models/
│   ├── ridge_model.pkl
│   ├── random_forest_model.pkl
│   ├── gradient_boosting_model.pkl
│   ├── stockout_model.pkl
│   ├── ensemble_scaler.pkl
│   ├── categorical_metadata.json
│   └── pipeline_metadata.json
├── src/
│   ├── __init__.py
│   ├── data_loader.py
│   ├── preprocessing.py
│   ├── feature_engineering.py
│   ├── train_models.py
│   ├── evaluate_models.py
│   ├── stockout_model.py
│   └── decision_engine.py
├── backend/
│   └── app.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardHome.jsx
│   │   │   ├── DemandPrediction.jsx
│   │   │   ├── ModelAnalysis.jsx
│   │   │   ├── ATMRisk.jsx
│   │   │   ├── DispatchCenter.jsx
│   │   │   ├── WhatIfPrediction.jsx
│   │   │   └── AboutMethodology.jsx
│   │   ├── App.jsx
│   │   ├── config.js
│   │   └── main.jsx
│   └── package.json
├── outputs/
│   ├── plots/
│   │   ├── actual_vs_predicted.png
│   │   ├── model_comparison.png
│   │   ├── feature_importance.png
│   │   └── confusion_matrix.png
│   └── metrics/
│       ├── regression_metrics.csv
│       ├── classification_metrics.csv
│       └── dispatch_decisions.csv
├── tests/
│   ├── test_preprocessing.py
│   └── test_decision_engine.py
├── main_pipeline.py
├── conftest.py
├── requirements.txt
├── .gitignore
└── README.md
```

---

## 8. Installation & How to Run

### Step 1: Install Python Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Run Machine Learning Pipeline
Trains regression and classification models, performs grid searches, and exports evaluation charts:
```bash
python main_pipeline.py
```

### Step 3: Run Automated Tests
```bash
python -m pytest tests/
```

### Step 4: Start Backend API (FastAPI)
```bash
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
```

### Step 5: Start Frontend Dashboard (React + Vite)
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser to access the dashboard.

---

## 9. Future Improvements
- Incorporating multi-step time-series models (e.g., ARIMA, Prophet, or LSTM).
- Geographic route optimization (Vehicle Routing Problem) for cash-in-transit trucks.
- Real-time IoT sensor integration for automated vault telemetry.
- Continual learning and model drift monitoring pipelines.

---

## 10. Academic Disclaimer
This project is an educational machine learning simulation created for undergraduate coursework. It does not interface with live banking systems or real monetary transactions.
