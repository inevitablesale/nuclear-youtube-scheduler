import os
import json
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import our existing modules
from rss_client import parse_feed, dedupe_recent, filter_by_domains
from creatify_client import CreatifyClient
from youtube_uploader import (
    build_youtube_client, upload_short, short_url, create_top_comment, build_title
)
from openai_client import generate_pinned_comment, generate_custom_comments
from smm_client import SMMClient

app = FastAPI(title="Nuclear YouTube Scheduler API", version="1.0.0")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:3000",
        "https://*.netlify.app",
        "https://nuclear-scheduler.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state (in production, use Redis or database)
app_state = {
    "config": None,
    "queue": [],
    "logs": [],
    "is_processing": False
}

# Pydantic models
class ConfigModel(BaseModel):
    timezone: str
    agents: Dict[str, Any]
    rss: Dict[str, Any]
    openai: Dict[str, Any]
    creatify: Dict[str, Any]
    nuclearsmm: Dict[str, Any]
    youtube: Dict[str, Any]

class QueueItem(BaseModel):
    id: str
    title: str
    url: str
    agent: str
    status: str = "pending"
    created_at: str

class LogEntry(BaseModel):
    id: str
    message: str
    type: str
    timestamp: str

# Utility functions
def add_log(message: str, log_type: str = "info"):
    log_entry = {
        "id": str(len(app_state["logs"]) + 1),
        "message": message,
        "type": log_type,
        "timestamp": datetime.now().isoformat()
    }
    app_state["logs"].append(log_entry)
    # Keep only last 100 logs
    if len(app_state["logs"]) > 100:
        app_state["logs"] = app_state["logs"][-100:]

def build_clients(config):
    """Build Creatify and SMM clients from config"""
    creatify_cfg = config["creatify"]
    creatify = CreatifyClient(
        base_url=creatify_cfg["base_url"],
        api_id_env=creatify_cfg["api_id_env"],
        api_key_env=creatify_cfg["api_key_env"],
        target_audience="",  # Will be set per agent
        defaults=creatify_cfg["defaults"]
    )
    smm = SMMClient(
        config["nuclearsmm"]["api_key"],
        config["nuclearsmm"]["api_url"],
        config["nuclearsmm"]["services"]
    )
    return creatify, smm

# API Endpoints
@app.get("/")
async def root():
    return {"message": "Nuclear YouTube Scheduler API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/config")
async def update_config(config: ConfigModel):
    """Update the global configuration"""
    app_state["config"] = config.dict()
    add_log("Configuration updated", "info")
    return {"message": "Configuration updated successfully"}

@app.get("/config")
async def get_config():
    """Get the current configuration"""
    if app_state["config"] is None:
        raise HTTPException(status_code=404, detail="No configuration found")
    return app_state["config"]

@app.post("/rss/fetch")
async def fetch_rss():
    """Fetch RSS feeds and populate queue"""
    if app_state["config"] is None:
        raise HTTPException(status_code=400, detail="No configuration found")
    
    config = app_state["config"]
    add_log("Starting RSS feed fetch...", "info")
    
    try:
        # Parse RSS feed
        entries = parse_feed(
            config["rss"]["url"], 
            max_items=int(config["rss"].get("max_fetch", 30))
        )
        entries = dedupe_recent(
            entries, 
            window_hours=int(config["rss"].get("dedupe_hours", 48))
        )
        
        if not entries:
            add_log("No fresh items found in RSS feed", "info")
            return {"message": "No fresh items found", "items_added": 0}
        
        # Process entries by agent
        items_added = 0
        for agent_name, agent in config["agents"].items():
            pool = filter_by_domains(entries, agent["allowed_domains"])
            if not pool:
                add_log(f"No items found for agent {agent_name}", "info")
                continue
            
            # Add items to queue
            for entry in pool:
                queue_item = {
                    "id": f"{agent_name}_{len(app_state['queue'])}_{entry['link'][-10:]}",
                    "title": entry["title"],
                    "url": entry["link"],
                    "agent": agent_name,
                    "status": "pending",
                    "created_at": datetime.now().isoformat()
                }
                app_state["queue"].append(queue_item)
                items_added += 1
        
        add_log(f"Added {items_added} items to queue", "success")
        return {"message": f"Added {items_added} items to queue", "items_added": items_added}
        
    except Exception as e:
        add_log(f"RSS fetch failed: {str(e)}", "error")
        raise HTTPException(status_code=500, detail=f"RSS fetch failed: {str(e)}")

@app.get("/queue")
async def get_queue():
    """Get the current queue"""
    return {"queue": app_state["queue"], "count": len(app_state["queue"])}

@app.delete("/queue/{item_id}")
async def remove_queue_item(item_id: str):
    """Remove an item from the queue"""
    original_count = len(app_state["queue"])
    app_state["queue"] = [item for item in app_state["queue"] if item["id"] != item_id]
    
    if len(app_state["queue"]) < original_count:
        add_log(f"Removed item {item_id} from queue", "info")
        return {"message": "Item removed from queue"}
    else:
        raise HTTPException(status_code=404, detail="Item not found in queue")

@app.delete("/queue")
async def clear_queue():
    """Clear the entire queue"""
    count = len(app_state["queue"])
    app_state["queue"] = []
    add_log(f"Cleared {count} items from queue", "info")
    return {"message": f"Cleared {count} items from queue"}

@app.post("/queue/process")
async def process_queue(background_tasks: BackgroundTasks):
    """Start processing the queue"""
    if app_state["is_processing"]:
        raise HTTPException(status_code=400, detail="Queue is already being processed")
    
    if not app_state["queue"]:
        raise HTTPException(status_code=400, detail="Queue is empty")
    
    if app_state["config"] is None:
        raise HTTPException(status_code=400, detail="No configuration found")
    
    # Start background processing
    background_tasks.add_task(process_queue_background)
    add_log("Started queue processing", "info")
    return {"message": "Queue processing started"}

async def process_queue_background():
    """Background task to process the queue"""
    app_state["is_processing"] = True
    config = app_state["config"]
    
    try:
        creatify, smm = build_clients(config)
        per_channel = int(config["youtube"]["daily_per_channel"])
        
        for agent_name, agent in config["agents"].items():
            # Get items for this agent
            agent_items = [item for item in app_state["queue"] if item["agent"] == agent_name]
            channels = agent["channels"]
            need = per_channel * len(channels)
            picks = agent_items[:need]
            
            if not picks:
                add_log(f"No items found for agent {agent_name}", "info")
                continue
            
            i = 0
            for item in picks:
                channel_label = channels[i % len(channels)]
                try:
                    await process_article_item(config, creatify, smm, channel_label, agent, item)
                    # Mark item as completed
                    item["status"] = "completed"
                except Exception as e:
                    add_log(f"Failed to process {item['title']}: {str(e)}", "error")
                    item["status"] = "failed"
                i += 1
        
        # Remove completed items
        app_state["queue"] = [item for item in app_state["queue"] if item["status"] != "completed"]
        add_log("Queue processing completed", "success")
        
    except Exception as e:
        add_log(f"Queue processing failed: {str(e)}", "error")
    finally:
        app_state["is_processing"] = False

async def process_article_item(config, creatify, smm, channel_label, agent, item):
    """Process a single article item"""
    ch_cfg = config["youtube"]["channels"][channel_label]
    
    # Set agent-specific target audience
    creatify.target_audience = agent["target_audience"]
    
    add_log(f"Processing: {item['title']} ({agent['label']} → {channel_label})", "info")
    
    # Build video from article
    shot = creatify.build_short_from_article(
        article_url=item["url"],
        name="Auto Short",
        overrides=None,
        target_audience=agent["target_audience"]
    )
    
    # Upload to YouTube
    yt = build_youtube_client(ch_cfg["client_secret_path"], ch_cfg["token_path"])
    
    import tempfile
    tmp_dir = tempfile.mkdtemp(prefix="creatify_")
    out_path = os.path.join(tmp_dir, shot["filename"])
    with open(out_path, "wb") as f:
        f.write(shot["video_bytes"])
    
    title = build_title(ch_cfg["title_prefix"], shot["filename"], config["youtube"]["title_max_len"])
    vid = upload_short(
        yt=yt,
        file_path=out_path,
        title=title,
        description=ch_cfg["default_description"],
        tags=ch_cfg["default_tags"],
        categoryId=ch_cfg["categoryId"],
        privacy=ch_cfg["privacy"],
        madeForKids=ch_cfg["madeForKids"],
        selfDeclaredMadeForKids=ch_cfg["selfDeclaredMadeForKids"]
    )
    vurl = short_url(vid)
    add_log(f"Uploaded: {vurl}", "success")
    
    # Generate and post comments
    pin = generate_pinned_comment(
        title=title, 
        description=ch_cfg["default_description"], 
        tags=ch_cfg["default_tags"], 
        persona_hint=agent["label"]
    )
    replies = generate_custom_comments(
        title=title, 
        description=ch_cfg["default_description"], 
        tags=ch_cfg["default_tags"], 
        n=2, 
        persona_hint=agent["label"]
    )
    _, curl = create_top_comment(yt, vid, pin)
    add_log(f"Posted author comment: {curl}", "info")
    
    # Boost with SMM
    res = smm.boost_short(
        video_url=vurl,
        pin_comment_url=curl,
        reply_comment_url=curl,
        reply_texts=replies
    )
    add_log(f"SMM boost results: {res}", "info")
    
    # Cleanup
    os.remove(out_path)
    os.rmdir(tmp_dir)

@app.get("/logs")
async def get_logs():
    """Get the activity logs"""
    return {"logs": app_state["logs"], "count": len(app_state["logs"])}

@app.delete("/logs")
async def clear_logs():
    """Clear the activity logs"""
    count = len(app_state["logs"])
    app_state["logs"] = []
    add_log("Logs cleared", "info")
    return {"message": f"Cleared {count} log entries"}

@app.get("/status")
async def get_status():
    """Get the current system status"""
    return {
        "is_processing": app_state["is_processing"],
        "queue_count": len(app_state["queue"]),
        "logs_count": len(app_state["logs"]),
        "has_config": app_state["config"] is not None,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)