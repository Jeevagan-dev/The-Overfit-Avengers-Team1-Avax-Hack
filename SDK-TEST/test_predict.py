from mlaas_sdk import MLaaSClient

client = MLaaSClient(
    base_url="http://localhost:3001/api",
    model_id="QmbvbnPxNPF22qDTWhTqbgRY8W63mvuF2chDUgRaWQAM6Q",
    user_address="0x41D925BE2Cc235cd4f196872eEBC600231D68a4D",
    api_key="a742394dc4d32a43ab5c00d4fac654bce6ecbbdfbfe90acd8f75762d858b2317"
)


input_data = [
  {
    "text": "I love avax hackathon!"
  },
  {
    "text": "its worst day"
  }
]

try:
    result = client.predict(input_data)
    print("✅ Prediction:", result)
except Exception as e:
    print("❌ Error:", e)

