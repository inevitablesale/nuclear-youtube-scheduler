import os
from typing import List, Optional
from openai import OpenAI

def _client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY env var is not set.")
    return OpenAI(api_key=api_key)

PIN_PROMPT = """You are writing a short, friendly top comment for a YouTube Short about automotive SEO.
Keep it under 140 characters.
Goal: invite viewers to reply with a quick action ("drop your site", "ask a question", etc.)
Tone: concise, helpful, non-spammy.
Context:
Title: {title}
Description: {description}
Tags: {tags}
Return only the comment text, no quotes.
"""

CUSTOM_PROMPT = """You are generating {n} short, natural viewer comments for a YouTube Short about automotive SEO.
Each comment must be under 120 characters, varied, and relevant to:
Title: {title}
Description: {description}
Tags: {tags}
Avoid emojis overload, no links, no sales pitches, no repeated phrasing.
Return as a JSON array of strings.
"""

def generate_pinned_comment(title: str, description: str, tags: List[str], persona_hint: Optional[str] = None) -> str:
    client = _client()
    prefix = (persona_hint + "\n\n") if persona_hint else ""
    msg = prefix + PIN_PROMPT.format(title=title, description=description, tags=", ".join(tags))
    resp = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        messages=[{"role":"user","content": msg}],
        temperature=0.7,
        max_tokens=100
    )
    return resp.choices[0].message.content.strip()

def generate_custom_comments(title: str, description: str, tags: List[str], n: int=2, persona_hint: Optional[str] = None) -> List[str]:
    client = _client()
    prefix = (persona_hint + "\n\n") if persona_hint else ""
    msg = prefix + CUSTOM_PROMPT.format(n=n, title=title, description=description, tags=", ".join(tags))
    resp = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        messages=[{"role":"user","content": msg}],
        temperature=0.8,
        max_tokens=200
    )
    import json
    txt = resp.choices[0].message.content.strip()
    try:
        arr = json.loads(txt)
        return [s.strip() for s in arr][:n]
    except Exception:
        return [line.strip(" -•") for line in txt.splitlines() if line.strip()][:n]