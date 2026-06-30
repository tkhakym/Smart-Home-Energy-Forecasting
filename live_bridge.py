from flask import Flask, jsonify, request
from flask_cors import CORS
import paho.mqtt.client as mqtt
import json
import sqlite3
import numpy as np
from datetime import datetime, timedelta
import pandas as pd
import joblib
import warnings

# Suppress pandas SettingWithCopyWarning as recommended by the manual [cite: 189]
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# --- 1. INITIALIZE DATABASE ---
def init_db():
    conn = sqlite3.connect('energy_data.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS readings
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                  total_power REAL,
                  ac REAL,
                  fridge REAL,
                  tv REAL,
                  lighting REAL,
                  phantom REAL)''')
    conn.commit()
    conn.close()

init_db()

# --- 2. LOAD XGBOOST MODEL ---
try:
    # Load the fully trained XGBoost regression model [cite: 5]
    xgb_model = joblib.load('xgboost_energy_model.pkl') # [cite: 43]
    # Load the list of exactly 10 feature names [cite: 35]
    feature_cols = joblib.load('feature_cols.pkl') # [cite: 44]
    MODEL_LOADED = True
    print("XGBoost model and feature columns loaded successfully.")
except Exception as e:
    print(f"Warning: Could not load XGBoost model files. Ensure .pkl files are in the same directory. Error: {e}") # [cite: 171, 172, 173]
    MODEL_LOADED = False

# --- 3. STATE & MODEL PIPELINE ---
live_data = {"current_usage_kW": 0.0, "predicted_next_hour_kW": 0.0, "ac": 0.0, "fridge": 0.0, "tv": 0.0, "lighting": 0.0, "random_sensor": 0.0}

def prepare_data(df):
    """Prepares raw hourly dataframe into model-ready features[cite: 81]."""
    df = df.copy()
    
    # 1. Calendar Features [cite: 79]
    df['hour'] = df.index.hour
    df['dayofweek'] = df.index.dayofweek
    df['month'] = df.index.month
    df['quarter'] = df.index.quarter
    df['is_weekend'] = df.index.dayofweek.isin([5, 6]).astype(int)
    
    # 2. Lag Features [cite: 79]
    df['lag_1h'] = df['Global_active_power_kW'].shift(1)
    df['lag_24h'] = df['Global_active_power_kW'].shift(24)
    df['lag_168h'] = df['Global_active_power_kW'].shift(168)
    
    # 3. Rolling Features [cite: 79]
    df['rolling_24h'] = df['lag_1h'].rolling(window=24).mean()
    df['rolling_168h'] = df['lag_1h'].rolling(window=168).mean()
    
    # Drops the first 168 rows where lag_168h is undefined [cite: 87]
    return df.dropna()

def get_prediction():
    """Generates next-hour forecast using XGBoost and historical DB data."""
    if not MODEL_LOADED:
        return 0.0

    conn = sqlite3.connect('energy_data.db')
    
    query = """
        SELECT strftime('%Y-%m-%d %H:00:00', timestamp) as datetime,
               AVG(total_power) as Global_active_power_kW
        FROM readings
        GROUP BY strftime('%Y-%m-%d %H:00:00', timestamp)
        ORDER BY datetime DESC
        LIMIT 200
    """
    df = pd.read_sql_query(query, conn)
    conn.close()

    if len(df) < 169:
        return 0.0 

    df['datetime'] = pd.to_datetime(df['datetime'])
    df = df.set_index('datetime').sort_index()

    df_feat = prepare_data(df)

    if df_feat.empty:
        return 0.0

    # Get the latest row of features
    latest_features = df_feat[feature_cols].tail(1).copy()
    
    # --- REAL-TIME OVERRIDE ---
    # Overwrite the hourly average with the exact live reading from Wokwi.
    # This makes the AI highly reactive to your dashboard toggles instantly.
    current_live_power = live_data.get("current_usage_kW", 0.0)
    if current_live_power > 0:
        latest_features['lag_1h'] = current_live_power
    
    # Generate prediction
    prediction = xgb_model.predict(latest_features)[0]
    
    return round(float(prediction), 3)
    df = pd.read_sql_query(query, conn)
    conn.close()

    # Provide at least 169 rows of hourly data, otherwise all lag features become NaN [cite: 192, 193]
    if len(df) < 169:
        return 0.0 

    # Datetime formatting and setting index [cite: 70, 71, 72]
    df['datetime'] = pd.to_datetime(df['datetime'])
    df = df.set_index('datetime').sort_index()

    # Build the 10 features [cite: 134]
    df_feat = prepare_data(df)

    if df_feat.empty:
        return 0.0

    # Ensure columns are passed in the exact order required by the model [cite: 36, 52]
    latest_features = df_feat[feature_cols].tail(1)
    
    # Generate prediction [cite: 91]
    prediction = xgb_model.predict(latest_features)[0]
    
    return round(float(prediction), 3)

def on_message(client, userdata, msg):
    global live_data
    try:
        payload = json.loads(msg.payload.decode('utf-8'))
        current_power = payload.get('total_power', 0)
        
        # Save to SQLite BEFORE predicting, so the current reading influences the latest hour's average
        conn = sqlite3.connect('energy_data.db')
        c = conn.cursor()
        c.execute('''INSERT INTO readings (total_power, ac, fridge, tv, lighting, phantom) VALUES (?, ?, ?, ?, ?, ?)''', 
                  (current_power, payload.get("ac", 0), payload.get("fridge", 0), payload.get("tv", 0), payload.get("lighting", 0), payload.get("random_sensor", 0)))
        conn.commit()
        conn.close()

        # Update live state
        live_data.update({
            "ac": payload.get("ac", 0),
            "fridge": payload.get("fridge", 0),
            "tv": payload.get("tv", 0),
            "lighting": payload.get("lighting", 0),
            "random_sensor": payload.get("random_sensor", 0),
            "current_usage_kW": round(current_power, 3),
            "predicted_next_hour_kW": get_prediction()
        })

    except Exception as e:
        print(f"Error processing MQTT message: {e}")

# Initialize MQTT
try:
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
except:
    client = mqtt.Client()

client.on_message = on_message
client.connect("broker.hivemq.com", 1883, 60)
client.subscribe("akmal/home/energy")
client.loop_start()

# --- 4. API ENDPOINTS ---
@app.route("/latest", methods=["GET"])
def latest():
    """Returns real-time Wokwi data and calculated AI prediction."""
    return jsonify(live_data)

@app.route("/replay", methods=["GET"])
def replay():
    """Endpoint for Node-RED AI prediction historical charts."""
    hours = int(request.args.get('hours', 24))
    conn = sqlite3.connect('energy_data.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    # Fetching actuals; prediction column is set to 0 for historical replay as requested
    c.execute("SELECT timestamp as t, total_power as actual, 0 as predicted FROM readings ORDER BY id DESC LIMIT ?", (hours * 60,))
    history = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify(history)

@app.route("/api/analytics", methods=["GET"])
def analytics_api():
    view = request.args.get('view', 'live')
    conn = sqlite3.connect('energy_data.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Calculate Totals
    c.execute('''SELECT COUNT(*) as record_count, SUM(total_power) as sum_total, SUM(ac) as sum_ac, 
                 SUM(fridge) as sum_fridge, SUM(tv) as sum_tv, SUM(lighting) as sum_lighting, SUM(phantom) as sum_phantom 
                 FROM readings''')
    totals = dict(c.fetchone())
    if totals['sum_total'] is None: totals = {k: 0 for k in totals.keys()}

    # Fetch History
    if view == 'daily':
        c.execute("SELECT strftime('%Y-%m-%d', timestamp) as timestamp, AVG(total_power) as total_power FROM readings GROUP BY strftime('%Y-%m-%d', timestamp) ORDER BY timestamp DESC LIMIT 50")
    elif view == 'monthly':
        c.execute("SELECT strftime('%Y-%m', timestamp) as timestamp, AVG(total_power) as total_power FROM readings GROUP BY strftime('%Y-%m', timestamp) ORDER BY timestamp DESC LIMIT 50")
    elif view == 'hourly':
        c.execute("SELECT strftime('%Y-%m-%d %H:00', timestamp) as timestamp, AVG(total_power) as total_power FROM readings GROUP BY strftime('%Y-%m-%d %H:00', timestamp) ORDER BY timestamp DESC LIMIT 50")
    else:
        c.execute("SELECT timestamp, total_power FROM readings ORDER BY id DESC LIMIT 50")
        
    history = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify({"totals": totals, "history": history[::-1]})
@app.route("/daily", methods=["GET"])
def daily():
    """Endpoint for the React Deep Analytics page to fetch daily averages."""
    days = int(request.args.get('days', 14))
    conn = sqlite3.connect('energy_data.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('''SELECT strftime('%Y-%m-%d', timestamp) as timestamp, 
                 AVG(total_power) as total_power 
                 FROM readings 
                 GROUP BY strftime('%Y-%m-%d', timestamp) 
                 ORDER BY timestamp DESC LIMIT ?''', (days,))
    data = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify(data)

@app.route("/history", methods=["GET"])
def history_endpoint():
    """Endpoint for historical charts."""
    hours = int(request.args.get('hours', 48))
    conn = sqlite3.connect('energy_data.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT timestamp, total_power FROM readings ORDER BY id DESC LIMIT ?", (hours * 60,))
    data = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify(data[::-1])

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)