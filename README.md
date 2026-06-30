# ⚡ Smart Home Energy Forecasting & Management

![UI Preview](https://img.shields.io/badge/UI-React%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react)
![Backend](https://img.shields.io/badge/API-Flask%20%7C%20Python-3776AB?style=for-the-badge&logo=python)
![Status](https://img.shields.io/badge/Status-Completed-success?style=for-the-badge)

A high-performance, real-time energy monitoring dashboard designed to track, forecast, and optimize household electricity consumption. This system leverages live sensor telemetry, predictive analytics, and dynamic limiters to help users reduce utility costs and maintain grid stability within their household.

---

## 📸 System Screenshots

### Dashboard Overview
<img width="2168" height="1402" alt="Homepage" src="https://github.com/user-attachments/assets/95c47891-5bc8-400a-a571-cc7c23480a3b" />
The main interface featuring real-time SciChart power rendering, AI insights, and dynamic tariff tracking.

### Secure Authentication Gateway
<img width="2056" height="1282" alt="Login Page" src="https://github.com/user-attachments/assets/6d997a33-ec3c-40f5-b31e-3ded2dc57cfb" />
Client-side JWT authentication gateway securing the telemetry data and limiter controls.

---

## ⚙️ System Specifications

### Frontend Architecture (Client)
* **Framework:** React.js powered by Vite for rapid HMR and optimized builds.
* **Styling:** Tailwind CSS, utilizing a bespoke dark-mode "terminal" aesthetic (`slate-900` palette).
* **Data Visualization:** `SciChart.js` for scientific-grade, high-frequency data plotting without UI thread blocking.
* **Typography & Iconography:** Google Sans Code integration with Lucide React vector icons.
* **State Management:** React Hooks (`useState`, `useEffect`, `useRef`) managing live telemetry buffers and UI toggles.

### Backend Architecture (API)
* **Framework:** Python Flask providing low-latency RESTful data endpoints.
* **Authentication:** PyJWT implementation for secure token-based endpoint verification.
* **External Integrations:** Open-Meteo API fetching live meteorological data (temperature and humidity) for context-aware AI insights.
* **Data Payload Structure:** JSON payloads delivering total power (kW), appliance breakdowns, and predicted next-hour usage.

### Intelligent Core Features
* **Live Energy Polling:** 2000ms interval fetching for real-time interface updates.
* **Dynamic Tariff Calculation:** Automated peak/off-peak logic dynamically applying TNB rates based on the system clock.
* **Threshold Limiter:** Visual pulse alerts (red/amber) when user-configured power (kW) and budget (RM) limits are breached.

---

## 🖥️ Server Details & Setup Guide

The system operates on a dual-server local architecture. You must run both servers concurrently to fully boot the application.

### 1. Backend Server (Flask API)
The backend acts as the telemetry provider and secure gateway.
* **Host/Port:** `http://127.0.0.1:5001`
* **Core Endpoints:**
  * `GET /latest`: Returns live sensor array data and current overall kW draw.
  * `GET /daily`: Returns historical daily consumption for the Analytics view.

**To Start:**
```bash
# Navigate to the backend directory
python -m venv .venv
source .venv/bin/activate  # On Mac/Linux
pip install -r requirements.txt
python app.py
