
import sys
import json
import pickle
import os
import traceback

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

if len(sys.argv) < 3:
    eprint("Usage: python predict.py <model_path> '<json_input>'")
    sys.exit(1)

model_path = sys.argv[1]
try:
    input_json = sys.argv[2]
    input_data = json.loads(input_json)
except Exception as e:
    eprint(f"❌ Error parsing input JSON: {e}")
    sys.exit(1)

eprint("🧠 Prediction request received")
eprint("🔮 Running prediction...")

if not os.path.exists(model_path):
    eprint(f"❌ Error: Model file not found at {model_path}")
    sys.exit(1)

try:
    with open(model_path, "rb") as f:
        vectorizer, model = pickle.load(f)  
except Exception as e:
    eprint(f"❌ Failed to load model: {e}")
    sys.exit(1)

try:
    texts = [item["text"] for item in input_data]
    X_vec = vectorizer.transform(texts)
    preds = model.predict(X_vec)
    labels = ["negative" if p == 0 else "positive" for p in preds]
    print(json.dumps({"predictions": labels})) 
except Exception as e:
    eprint(f"⚠️ Python error: {e}")
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)
