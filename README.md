# ⚡ Smart Home Energy Forecasting & Management

![UI Preview](https://img.shields.io/badge/UI-React%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react)
![Backend](https://img.shields.io/badge/API-Flask%20%7C%20Python-3776AB?style=for-the-badge&logo=python)
![AI/ML](https://img.shields.io/badge/ML-XGBoost%20%7C%20Forecasting-brightgreen?style=for-the-badge&logo=scikit-learn)
![Status](https://img.shields.io/badge/Status-Completed-success?style=for-the-badge)

A full-stack, AI-powered Smart Home monitoring system designed to bridge real-time IoT hardware telemetry with predictive energy analytics. This system tracks household electricity consumption, forecasts future energy demands, and provides an interactive, secure dashboard for optimized resource management.

---
## 📸 System Screenshots

### Dashboard Overview
<img width="2168" height="1402" alt="Homepage" src="https://github.com/user-attachments/assets/95c47891-5bc8-400a-a571-cc7c23480a3b" />
The main interface featuring real-time SciChart power rendering, AI insights, and dynamic tariff tracking.

### Secure Authentication Gateway
<img width="2056" height="1282" alt="Login Page" src="https://github.com/user-attachments/assets/6d997a33-ec3c-40f5-b31e-3ded2dc57cfb" />
Client-side JWT authentication gateway securing the telemetry data and limiter controls.


## 🏗️ System Architecture

The project operates on an end-to-end data pipeline:
1.  **IoT Layer (Wokwi):** Simulated sensors (ESP32/ESP8266) generate real-time energy telemetry.
2.  **Bridge Layer (`live_bridge.py`):** A Flask-based middleware that ingests IoT data, handles authentication, and triggers model inference.
3.  **AI Core:** XGBoost models (`.pkl`) process telemetry to predict usage trends.
4.  **Presentation Layer (React):** A high-performance dashboard visualizing live data and AI insights via SciChart.js.

---

## ⚙️ Core Components

### 1. IoT Hardware Simulation (Wokwi)
* **Platform:** Wokwi
* **Role:** Simulates a smart energy meter which transmits power draw (kW) data via HTTP `POST` requests to the Flask backend.

### 2. Backend (`live_bridge.py`)
* **Framework:** Flask
* **Key Capabilities:**
    * **Data Ingestion:** Receives payloads from the IoT simulation.
    * **ML Inference:** Loads pre-trained models to calculate consumption forecasts.
    * **Data Prep:** Uses `data_prep.py` and `feature_cols.pkl` to format raw sensor inputs before the model processes them.

### 3. Machine Learning Engine
* **Models:** XGBoost Regressor
* **Files:** `xgboost_energy_model.pkl`, `hourly_xgb_model.pkl`, `daily_xgb_model.pkl`.
* **Features:** Trained on historical consumption data to output accurate short-term usage forecasts.

### 4. Frontend Dashboard (React)
* **Framework:** React + Vite
* **Visuals:** SciChart.js for scientific-grade time-series plotting.
* **Features:** Live telemetry monitoring, AI recommendation alerts, and user-defined budget limiters.

---

## 🚀 Setup Instructions

### Prerequisites
* Python 3.x
* Node.js & npm

### 1. Backend Setup (Terminal 1)
```bash
# Navigate to the project root
python -m venv .venv
source .venv/bin/activate  # On Mac/Linux
pip install -r requirements.txt

# Start the Flask bridge
python live_bridge.py
