# run.py
import webbrowser
import threading
import time
import uvicorn
import sys
import os

# Add the current directory to path so main.py can be found
sys.path.insert(0, os.path.dirname(__file__))

def open_browser():
    time.sleep(1)  # wait for server to start
    webbrowser.open("http://localhost:5000")

if __name__ == "__main__":
    threading.Thread(target=open_browser, daemon=True).start()
    from main import app
    uvicorn.run(app, host="127.0.0.1", port=5000)