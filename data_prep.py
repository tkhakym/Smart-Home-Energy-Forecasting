import pandas as pd
import numpy as np

def prepare_data():
    print("1. Loading the massive dataset... (this might take a moment)")
    # We tell pandas that the separator is a semicolon and that '?' means missing data
    df = pd.read_csv('household_power_consumption.txt', sep=';', 
                     na_values=['?'], low_memory=False)

    print("2. Stitching Date and Time together...")
    # Combine the string columns, convert to a true Datetime object, and make it the index
    df['Datetime'] = pd.to_datetime(df['Date'] + ' ' + df['Time'], format='%d/%m/%Y %H:%M:%S')
    df.set_index('Datetime', inplace=True)
    df.drop(['Date', 'Time'], axis=1, inplace=True)

    print("3. Patching missing data...")
    # Forward-fill (ffill) takes the last known measurement and carries it forward
    # This prevents us from breaking the continuous flow of time
    df = df.ffill()

    print("4. Calculating Un-metered Energy...")
    # Using the exact formula from your dataset documentation
    df['Unmetered_Energy'] = (df['Global_active_power'] * 1000 / 60) - \
                             df['Sub_metering_1'] - df['Sub_metering_2'] - df['Sub_metering_3']

    print("5. Aggregating into Hourly and Daily datasets...")
    # Resample 'h' groups by hour, 'D' groups by day. We sum the usage for those periods.
    df_hourly = df.resample('h').sum()
    df_daily = df.resample('D').sum()

    # Save these clean, aggregated datasets so we don't have to do this math ever again
    df_hourly.to_csv('hourly_energy.csv')
    df_daily.to_csv('daily_energy.csv')

    print("\nSUCCESS! Data is prepped and saved.")
    print(f"Hourly Rows: {df_hourly.shape[0]} | Daily Rows: {df_daily.shape[0]}")

if __name__ == "__main__":
    prepare_data()