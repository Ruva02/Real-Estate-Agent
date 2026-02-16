import requests
try:
    response = requests.post("http://localhost:8002/chat", json={"message": "Hello"})
    print(response.status_code)
    print(response.text)
except Exception as e:
    print(e)
