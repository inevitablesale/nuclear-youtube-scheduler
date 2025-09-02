import json
from youtube_uploader import (
    build_youtube_client, pick_today_files, is_short_video,
    build_title, upload_short, short_url, create_top_comment
)
from smm_client import SMMClient
from openai_client import generate_pinned_comment, generate_custom_comments

def load_config():
    with open("config.json") as f:
        return json.load(f)

def main():
    cfg = load_config()
    smm = SMMClient(
        cfg["nuclearsmm"]["api_key"],
        cfg["nuclearsmm"]["api_url"],
        cfg["nuclearsmm"]["services"]
    )
    per_channel = cfg["youtube"]["daily_per_channel"]

    for label, ch in cfg["youtube"]["channels"].items():
        print(f"\n=== {label} ===")
        yt = build_youtube_client(ch["client_secret_path"], ch["token_path"])
        candidates = pick_today_files(ch["input_folder"], per_channel)
        if len(candidates) < per_channel:
            print(f"Warning: only found {len(candidates)} files in {ch['input_folder']}")

        for path in candidates:
            if not is_short_video(path, cfg["youtube"]["short_max_seconds"]):
                print(f"Skipping (not detected as short): {path}")
                continue

            title = build_title(ch["title_prefix"], path, cfg["youtube"]["title_max_len"])
            vid = upload_short(
                yt=yt,
                file_path=path,
                title=title,
                description=ch["default_description"],
                tags=ch["default_tags"],
                categoryId=ch["categoryId"],
                privacy=ch["privacy"],
                madeForKids=ch["madeForKids"],
                selfDeclaredMadeForKids=ch["selfDeclaredMadeForKids"]
            )
            url = short_url(vid)
            print(f"Uploaded: {url}")

            pin = generate_pinned_comment(title=title, description=ch["default_description"], tags=ch["default_tags"])
            replies = generate_custom_comments(title=title, description=ch["default_description"], tags=ch["default_tags"], n=2)

            try:
                _, c_url = create_top_comment(yt, vid, pin)
                print("Author comment:", c_url)
            except Exception as e:
                c_url = None
                print("Failed to create author comment:", e)

            res = smm.boost_short(
                video_url=url,
                pin_comment_url=c_url,
                reply_comment_url=c_url,
                reply_texts=replies
            )
            print("SMM order results:", res)

if __name__ == "__main__":
    main()