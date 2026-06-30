import sqlite3
import random
from datetime import datetime, timedelta

def spoof_database():
    conn = sqlite3.connect('energy_data.db')
    c = conn.cursor()
    
    # Ensure table exists just in case
    c.execute('''CREATE TABLE IF NOT EXISTS readings
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                  total_power REAL,
                  ac REAL,
                  fridge REAL,
                  tv REAL,
                  lighting REAL,
                  phantom REAL)''')
    
    print("Injecting 200 hours of historical data...")
    
    # Start exactly 200 hours ago from the current time
    start_time = datetime.now() - timedelta(hours=200)
    
    for i in range(200):
        # Advance time by exactly 1 hour per row to meet model requirements
        current_time = start_time + timedelta(hours=i)
        
        # Generate realistic numbers that safely fall within the model's trained range
        ac = round(random.uniform(0.0, 1.5), 3)
        fridge = round(random.uniform(0.1, 0.4), 3)
        tv = round(random.uniform(0.0, 0.2), 3)
        lighting = round(random.uniform(0.0, 0.3), 3)
        phantom = round(random.uniform(0.05, 0.15), 3)
        
        total_power = round(ac + fridge + tv + lighting + phantom, 3)
        
        c.execute('''INSERT INTO readings (timestamp, total_power, ac, fridge, tv, lighting, phantom) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)''', 
                  (current_time.strftime('%Y-%m-%d %H:00:00'), total_power, ac, fridge, tv, lighting, phantom))
                  
    conn.commit()
    conn.close()
    print("Spoofing complete! The database now has enough lag data for XGBoost.")

if __name__ == '__main__':
    spoof_database()