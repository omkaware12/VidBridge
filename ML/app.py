from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import requests
from dotenv import load_dotenv
import os

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Allow requests from React frontend

# Load environment variables
load_dotenv()
API_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:8000/api/v1/youtube/analytics")


# ---------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------

def fetch_data(token):
    """Fetch YouTube analytics from Node backend using the provided token."""
    if not token:
        raise Exception("JWT token required in Authorization header")

    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(API_URL, headers=headers)

    if response.status_code != 200:
        raise Exception(f"Failed to fetch data: {response.text}")

    return response.json()


def prepare_dataset(videos):
    """Prepare dataset for ML model."""
    df = pd.DataFrame(videos)

    # Convert necessary columns
    df["views"] = df["views"].astype(int)
    df["likes"] = df["likes"].astype(int)
    df["comments"] = df["comments"].astype(int)

    # Extract upload day/hour
    df["publishedAt"] = pd.to_datetime(df["publishedAt"], errors="coerce")
    df["upload_hour"] = df["publishedAt"].dt.hour
    df["upload_day"] = df["publishedAt"].dt.dayofweek

    # Remove rows with NaT (invalid dates)
    df = df.dropna(subset=["upload_hour", "upload_day"])

    return df


def train_and_predict(df):
    """Train RandomForest model and find best upload time."""
    if len(df) < 3:
        return {"error": "Not enough video data to train model"}

    X = df[["upload_hour", "upload_day", "likes", "comments"]]
    y = df["views"]

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)

    # Predict for all hours/days
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
        "expected_views": round(float(best["predicted_views"]), 2),
    }


# ---------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------

@app.route("/")
def home():
    return jsonify({"message": "VidBridge ML Prediction API is running"})


@app.route("/predict_best_time", methods=["GET"])
def predict_best_time():
    """Main ML endpoint called by frontend."""
    try:
        # 1️⃣ Extract JWT token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "JWT token missing"}), 401

        token = auth_header.split(" ")[1]

        # 2️⃣ Fetch analytics data from Node backend
        data = fetch_data(token)
        videos = data.get("videos", [])
        if not videos:
            return jsonify({"error": "No video data found"}), 400

        # 3️⃣ Prepare dataset and predict
        df = prepare_dataset(videos)
        result = train_and_predict(df)

        return jsonify(result), 200

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------
# Run Flask server
# ---------------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
 