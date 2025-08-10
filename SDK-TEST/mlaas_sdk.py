# mlaas_sdk.py

import requests
import json

class MLaaSClient:
    def __init__(self, base_url, model_id, user_address, api_key):
        self.base_url = base_url.rstrip("/")
        self.model_id = model_id
        self.user_address = user_address
        self.api_key = api_key

    def predict(self, input_data):
        url = f"{self.base_url}/predict"
        payload = {
            "modelId": self.model_id,
            "userAddress": self.user_address,
            "apiKey": self.api_key,
            "inputData": input_data
        }

        try:
            response = requests.post(url, json=payload, timeout=15)
            response.raise_for_status()
            return response.json().get("prediction")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Prediction request failed: {str(e)}")
        except Exception as e:
            raise Exception(f"Unexpected error: {str(e)}")
