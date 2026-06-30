import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.metrics import mean_squared_error, mean_absolute_error
import pickle

def train_hourly_model():
    print("--- Training Hourly Forecasting Model ---")
    # 1. Load data
    df = pd.read_csv('hourly_energy.csv', index_col='Datetime', parse_dates=True)
    
    # 2. Feature Engineering (Teaching the model about time)
    df['Hour_of_Day'] = df.index.hour
    df['Lag_1_Hour'] = df['Global_active_power'].shift(1)
    df['Lag_24_Hours'] = df['Global_active_power'].shift(24)
    
    # Drop the first 24 rows because they won't have a 24-hour lag history
    df.dropna(inplace=True) 

    # 3. Split into X (Features) and Y (Target to predict)
    # We use our lag features and the hour of day to predict the actual power
    X = df[['Hour_of_Day', 'Lag_1_Hour', 'Lag_24_Hours']]
    y = df['Global_active_power']

    # 4. Chronological Train/Test Split (Train on 2006-2009, Test on 2010)
    split_date = '2010-01-01'
    X_train, X_test = X.loc[X.index < split_date], X.loc[X.index >= split_date]
    y_train, y_test = y.loc[y.index < split_date], y.loc[y.index >= split_date]

    # 5. Train the XGBoost Model
    print("Training XGBoost Hourly...")
    model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
    model.fit(X_train, y_train)

    # 6. Evaluate
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    print(f"Hourly Model Mean Absolute Error: {mae:.2f} kW")

    # 7. Save the model to a file
    with open('hourly_xgb_model.pkl', 'wb') as file:
        pickle.dump(model, file)
    print("Saved -> hourly_xgb_model.pkl\n")


def train_daily_model():
    print("--- Training Daily Forecasting Model ---")
    df = pd.read_csv('daily_energy.csv', index_col='Datetime', parse_dates=True)
    
    # Feature Engineering for Daily Macro-trends
    df['Day_of_Week'] = df.index.dayofweek
    df['Is_Weekend'] = df['Day_of_Week'].apply(lambda x: 1 if x >= 5 else 0)
    df['Lag_1_Day'] = df['Global_active_power'].shift(1)
    df['Lag_7_Days'] = df['Global_active_power'].shift(7)
    
    df.dropna(inplace=True)

    X = df[['Day_of_Week', 'Is_Weekend', 'Lag_1_Day', 'Lag_7_Days']]
    y = df['Global_active_power']

    split_date = '2010-01-01'
    X_train, X_test = X.loc[X.index < split_date], X.loc[X.index >= split_date]
    y_train, y_test = y.loc[y.index < split_date], y.loc[y.index >= split_date]

    print("Training XGBoost Daily...")
    model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=4, random_state=42)
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    print(f"Daily Model Mean Absolute Error: {mae:.2f} kW")

    with open('daily_xgb_model.pkl', 'wb') as file:
        pickle.dump(model, file)
    print("Saved -> daily_xgb_model.pkl\n")


if __name__ == "__main__":
    train_hourly_model()
    train_daily_model()
    print("PHASE 1 COMPLETE! Both models are trained and saved.")