import os
import time
import json
import requests
from typing import Optional, Dict, Any

class CreatifyClient:
    def __init__(self, base_url: str, api_id_env: str, api_key_env: str, target_audience: str, defaults: dict):
        self.base = base_url.rstrip("/")
        api_id = os.getenv(api_id_env)
        api_key = os.getenv(api_key_env)
        if not api_id or not api_key:
            raise RuntimeError(f"Missing Creatify creds. Set {api_id_env} and {api_key_env}.")
        self.H = {
            "X-API-ID": api_id,
            "X-API-KEY": api_key,
            "Content-Type": "application/json",
        }
        self.target_audience = target_audience
        self.defaults = defaults

    @staticmethod
    def _fix_hrizn(text: str) -> str:
        import re
        s2 = re.sub(r"\bHrizn\.io\b", 'Hrizn.io (pronounced "horizon dot eye-oh")', text, count=1)
        if s2 != text:
            return s2
        return re.sub(r"\bHrizn\b", 'Hrizn (pronounced "horizon")', text, count=1)

    def generate_script_from_link(self, url: str) -> str:
        body = {
            "url": url,
            "language": self.defaults.get("language", "en"),
            "video_length": self.defaults.get("video_length", 15),
            "script_styles": [self.defaults.get("script_style", "ThreeReasonsWriter")],
            "target_audience": self.target_audience,
        }
        r = requests.post(f"{self.base}/api/ai_scripts/", headers=self.H, data=json.dumps(body), timeout=60)
        r.raise_for_status()
        data = r.json()
        first = (data.get("generated_scripts") or [{}])[0]
        script = first.get("paragraphs") or first.get("script") or first or ""
        if not script:
            raise RuntimeError("No script returned by /api/ai_scripts/")
        return str(script)

    def create_video_from_link(
        self,
        url: str,
        name: str = "Auto Short",
        override_script: Optional[str] = None,
        overrides: Optional[Dict[str, Any]] = None,
        target_audience: Optional[str] = None
    ) -> Dict[str, Any]:
        body = {
            "link": url,
            "name": name,
            "target_platform": self.defaults.get("target_platform", "youtube_shorts"),
            "target_audience": target_audience or self.target_audience,
            "language": self.defaults.get("language", "en"),
            "video_length": self.defaults.get("video_length", 15),
            "aspect_ratio": self.defaults.get("aspect_ratio", "9x16"),
            "script_style": self.defaults.get("script_style", "ThreeReasonsWriter"),
            "visual_style": self.defaults.get("visual_style", "QuickTransitionTemplate"),
            "override_script": override_script,
            "no_cta": self.defaults.get("no_cta", False),
            "caption_setting": self.defaults.get("caption_setting"),
        }
        if overrides:
            body.update(overrides)
        r = requests.post(f"{self.base}/api/link_to_videos/", headers=self.H, data=json.dumps(body), timeout=60)
        r.raise_for_status()
        return r.json()

    def wait_until_done(self, job_id: str, poll_seconds: int = 8, timeout_seconds: int = 600) -> Dict[str, Any]:
        start = time.time()
        while True:
            r = requests.get(f"{self.base}/api/link_to_videos/{job_id}/", headers=self.H, timeout=30)
            r.raise_for_status()
            data = r.json()
            status = data.get("status")
            if status in ("done", "failed", "error", "cancelled"):
                return data
            if time.time() - start > timeout_seconds:
                raise TimeoutError(f"Creatify job {job_id} timed out; last status={status}")
            time.sleep(poll_seconds)

    @staticmethod
    def _download(url: str) -> bytes:
        with requests.get(url, stream=True, timeout=120) as r:
            r.raise_for_status()
            return r.content

    def build_short_from_article(
        self,
        article_url: str,
        name: str = "Auto Short",
        overrides: Optional[Dict[str, Any]] = None,
        target_audience: Optional[str] = None
    ) -> Dict[str, Any]:
        auto_script = self.generate_script_from_link(article_url)
        patched = self._fix_hrizn(auto_script)
        job = self.create_video_from_link(
            article_url, name=name, override_script=patched,
            overrides=overrides, target_audience=target_audience
        )
        job_id = job.get("id")
        if not job_id:
            raise RuntimeError(f"Creatify returned no job id: {job}")
        final = self.wait_until_done(job_id)
        if final.get("status") != "done":
            raise RuntimeError(f"Creatify job did not complete successfully: {final}")
        video_url = final.get("video_output")
        if not video_url:
            raise RuntimeError(f"No video_output in job: {final}")
        blob = self._download(video_url)
        return {
            "job": final,
            "video_bytes": blob,
            "filename": f"{name.replace(' ','_')}.mp4",
            "thumbnail_url": final.get("video_thumbnail"),
            "preview": final.get("preview"),
            "editor_url": final.get("editor_url"),
        }