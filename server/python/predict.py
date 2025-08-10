# python/predict.py

import sys
import json
import pickle
import numpy as np

def load_model(model_path):
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        return model
    except Exception as e:
        print(f" Error loading model: {str(e)}", file=sys.stderr)
        sys.exit(1)

def parse_input(input_json):
    try:
        data = json.loads(input_json)
        if isinstance(data, dict):
            return [list(data.values())]  # Single row
        elif isinstance(data, list):
            return [list(d.values()) for d in data]
        else:
            raise ValueError("Invalid input format")
    except Exception as e:
        print(f" Error parsing input: {str(e)}", file=sys.stderr)
        sys.exit(1)

def run_prediction(model, input_array):
    try:
        prediction = model.predict(input_array)
        print(json.dumps(prediction.tolist()))
    except Exception as e:
        print(f" Prediction failed: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(" Usage: predict.py <model_path> <input_json>", file=sys.stderr)
        sys.exit(1)

    model_path = sys.argv[1]
    input_json = sys.argv[2]

    model = load_model(model_path)
    input_array = parse_input(input_json)
    run_prediction(model, input_array)
