from flask import Flask, jsonify
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime
import requests

app = Flask(__name__)

# Replace this with your backend API endpoint
API_URL = "http://localhost:8000/api/v1/youtube/analytics"

def fetch_data():
    """Fetch analytics data from Node backend."""
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OGNkNmQwYjc2ZmZkMDEzYjU4NjI4MTQiLCJuYW1lIjoib20ga2F3YXJlIiwiZW1haWwiOiJva2F3YXJlN0BnbWFpbC5jb20iLCJyb2xlIjoiY3JlYXRvciIsImlhdCI6MTc1OTg0ODQ0MSwiZXhwIjoxNzYwMTk0MDQxfQ.st8KNQGNDi6h_gKR0wn8gQf23BgYXROEtT-n-Gwf7GY"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    response = requests.get(API_URL, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch data: {response.text}")
    return response.json()

def prepare_dataset(videos):
    """Prepare video dataset for ML."""
    df = pd.DataFrame(videos)
    df["views"] = df["views"].astype(int)
    df["likes"] = df["likes"].astype(int)
    df["comments"] = df["comments"].astype(int)

    df["publishedAt"] = pd.to_datetime(df["publishedAt"])
    df["upload_hour"] = df["publishedAt"].dt.hour
    df["upload_day"] = df["publishedAt"].dt.dayofweek
    return df

def train_and_predict(df):
    """Train model and find best upload time."""
    if len(df) < 3:
        return {"error": "Not enough data to train the model."}

    X = df[["upload_hour", "upload_day", "likes", "comments"]]
    y = df["views"]

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)

    # Generate possible upload times (24h × 7 days)
    grid = pd.DataFrame([(h, d) for h in range(24) for d in range(7)],
                        columns=["upload_hour", "upload_day"])
    grid["likes"] = df["likes"].mean()
    grid["comments"] = df["comments"].mean()
    grid["predicted_views"] = model.predict(grid)

    best = grid.loc[grid["predicted_views"].idxmax()]
    best_day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][int(best["upload_day"])]

    return {
        "best_hour": int(best["upload_hour"]),
        "best_day": best_day,
        "expected_views": round(float(best["predicted_views"]), 2)
    }

@app.route('/')
def home():
    return "ML Prediction API is running"

@app.route('/predict_best_time', methods=['GET'])
def predict_best_time():
    try:
        data = fetch_data()
        videos = data.get("videos", [])
        if not videos:
            return jsonify({"error": "No video data found"}), 400

        df = prepare_dataset(videos)
        result = train_and_predict(df)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
