#!/usr/bin/env python3
"""
Start the FastAPI backend server for Nuclear YouTube Scheduler
"""
import uvicorn
import os
import sys

def main():
    # Add current directory to Python path
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    
    print("🚀 Starting Nuclear YouTube Scheduler API Server...")
    print("📡 Backend will be available at: http://localhost:8000")
    print("📊 API docs will be available at: http://localhost:8000/docs")
    print("🔄 Frontend should connect to: http://localhost:8000")
    print("\n" + "="*60)
    
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()