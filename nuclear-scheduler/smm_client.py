import time
import requests
from typing import Optional, List, Dict, Any

class SMMClient:
    def __init__(self, api_key: str, api_url: str, services: dict):
        self.api_key = api_key
        self.api_url = api_url.rstrip("/")
        self.services = services

    def place_order(self, service_id: int, link: str, qty: int, extra: dict | None = None):
        data = {
            "key": self.api_key,
            "action": "add",
            "service": service_id,
            "link": link,
            "quantity": qty
        }
        if extra:
            data.update(extra)
        r = requests.post(self.api_url, data=data, timeout=20)
        try:
            return r.json()
        except Exception:
            return {"error": r.text}

    def boost_short(
        self,
        video_url: str,
        pin_comment_url: Optional[str] = None,
        reply_comment_url: Optional[str] = None,
        reply_texts: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        results = {}

        vsvc = self.services.get("views")
        if vsvc:
            results["views"] = self.place_order(vsvc["id"], video_url, vsvc["qty"])
            time.sleep(2)

        lsvc = self.services.get("likes")
        if lsvc:
            results["likes"] = self.place_order(lsvc["id"], video_url, lsvc["qty"])
            time.sleep(2)

        psvc = self.services.get("pin_likes")
        if psvc and pin_comment_url:
            results["pin_likes"] = self.place_order(psvc["id"], pin_comment_url, psvc["qty"])
            time.sleep(2)
        else:
            results["pin_likes"] = {"skipped": "no comment URL provided"}

        csvc = self.services.get("comments")
        if csvc:
            target_link = video_url
            if csvc.get("target") == "comment" and reply_comment_url:
                target_link = reply_comment_url

            extra = None
            if csvc.get("send_text") and reply_texts:
                extra = {"comments": "\n".join(reply_texts)}

            results["comments"] = self.place_order(csvc["id"], target_link, csvc["qty"], extra=extra)

        return results