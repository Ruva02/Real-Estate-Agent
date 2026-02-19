import sys
import os

# Add backend directory to path so imports work correctly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
os.chdir(os.path.join(os.path.dirname(__file__), "backend"))

from app import app
from waitress import serve

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5016))
    print(f"Starting production server on http://0.0.0.0:{port}")
    serve(app, host="0.0.0.0", port=port)
