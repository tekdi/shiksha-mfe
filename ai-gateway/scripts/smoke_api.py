import requests
print(requests.get('http://localhost:8000/health', timeout=10).json())
