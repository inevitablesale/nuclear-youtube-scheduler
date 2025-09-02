import time
import feedparser
from typing import List, Dict, Any
from urllib.parse import urlparse

def parse_feed(url: str, max_items: int = 20) -> List[Dict[str, Any]]:
    feed = feedparser.parse(url)
    out = []
    for e in feed.entries[:max_items]:
        link = getattr(e, "link", None)
        title = getattr(e, "title", "").strip()
        if not link or not title:
            continue
        published_ts = None
        if getattr(e, "published_parsed", None):
            published_ts = int(time.mktime(e.published_parsed))
        elif getattr(e, "updated_parsed", None):
            published_ts = int(time.mktime(e.updated_parsed))
        out.append({"title": title, "link": link, "published_ts": published_ts})
    out.sort(key=lambda x: (x["published_ts"] or 0), reverse=True)
    return out

def dedupe_recent(entries: List[Dict[str, Any]], window_hours: int = 48) -> List[Dict[str, Any]]:
    seen = set()
    out = []
    now = int(time.time())
    for e in entries:
        if e["published_ts"] and now - e["published_ts"] > window_hours * 3600:
            continue
        try:
            p = urlparse(e["link"])
            key = f"{p.netloc}{p.path}"
        except Exception:
            key = e["link"]
        if key in seen:
            continue
        seen.add(key)
        out.append(e)
    return out

def hostname(url: str) -> str:
    try:
        return urlparse(url).netloc.lower()
    except Exception:
        return ""

def filter_by_domains(entries: List[Dict[str, Any]], domains: List[str]) -> List[Dict[str, Any]]:
    domains = set(d.lower() for d in domains)
    out = []
    for e in entries:
        host = hostname(e["link"])
        if any(host.endswith(d) or host == d for d in domains):
            out.append(e)
    return out