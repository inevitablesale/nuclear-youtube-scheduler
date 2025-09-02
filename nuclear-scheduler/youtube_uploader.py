import os
from typing import List, Optional, Tuple
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2.credentials import Credentials

YOUTUBE_SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.force-ssl"
]

def _ensure_creds(client_secret_path: str, token_path: str, scopes: List[str]):
    creds = None
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, scopes)
    if not creds or not creds.valid:
        flow = InstalledAppFlow.from_client_secrets_file(client_secret_path, scopes)
        creds = flow.run_local_server(port=0)
        with open(token_path, "w") as f:
            f.write(creds.to_json())
    return creds

def build_youtube_client(client_secret_path: str, token_path: str):
    creds = _ensure_creds(client_secret_path, token_path, YOUTUBE_SCOPES)
    return build("youtube", "v3", credentials=creds, static_discovery=False)

def is_short_video(file_path: str, max_seconds: int = 60) -> bool:
    # Assuming Creatify outputs ≤ 60s vertical videos.
    return True

def pick_today_files(input_folder: str, count: int) -> List[str]:
    files = []
    for name in os.listdir(input_folder):
        if name.lower().endswith((".mp4", ".mov", ".m4v")):
            files.append(os.path.join(input_folder, name))
    files.sort(key=lambda p: os.path.getmtime(p), reverse=True)
    return files[:count]

def build_title(prefix: str, base_name: str, limit: int) -> str:
    core = os.path.splitext(os.path.basename(base_name))[0]
    title = f"{prefix}{core}"
    return title[:limit]

def upload_short(
    yt,
    file_path: str,
    title: str,
    description: str,
    tags: List[str],
    categoryId: str,
    privacy: str = "public",
    publish_at_iso: Optional[str] = None,
    madeForKids: bool = False,
    selfDeclaredMadeForKids: bool = False,
) -> str:
    media = MediaFileUpload(file_path, chunksize=-1, resumable=True)
    body = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": tags,
            "categoryId": categoryId
        },
        "status": {
            "privacyStatus": privacy,
            "selfDeclaredMadeForKids": selfDeclaredMadeForKids,
            "madeForKids": madeForKids
        }
    }
    if publish_at_iso:
        body["status"]["privacyStatus"] = "private"
        body["status"]["publishAt"] = publish_at_iso

    response = yt.videos().insert(
        part="snippet,status",
        body=body,
        media_body=media
    ).execute()
    return response["id"]

def create_top_comment(yt, video_id: str, text: str) -> Tuple[str, str]:
    body = {
        "snippet": {
            "videoId": video_id,
            "topLevelComment": {
                "snippet": {"textOriginal": text}
            }
        }
    }
    resp = yt.commentThreads().insert(part="snippet", body=body).execute()
    comment_id = resp["id"]
    url = f"https://www.youtube.com/watch?v={video_id}&lc={comment_id}"
    return comment_id, url

def short_url(video_id: str) -> str:
    return f"https://youtube.com/shorts/{video_id}"