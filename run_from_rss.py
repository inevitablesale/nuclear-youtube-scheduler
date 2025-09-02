import os
import json
import tempfile

from rss_client import parse_feed, dedupe_recent, filter_by_domains
from creatify_client import CreatifyClient
from youtube_uploader import (
    build_youtube_client, upload_short, short_url, create_top_comment, build_title
)
from openai_client import generate_pinned_comment, generate_custom_comments
from smm_client import SMMClient

def load_config():
    with open("config.json") as f:
        return json.load(f)

def build_clients(cfg):
    creatify_cfg = cfg["creatify"]
    creatify = CreatifyClient(
        base_url=creatify_cfg["base_url"],
        api_id_env=creatify_cfg["api_id_env"],
        api_key_env=creatify_cfg["api_key_env"],
        target_audience=creatify_cfg["target_audience"],
        defaults=creatify_cfg["defaults"]
    )
    smm = SMMClient(
        cfg["nuclearsmm"]["api_key"],
        cfg["nuclearsmm"]["api_url"],
        cfg["nuclearsmm"]["services"]
    )
    return creatify, smm

def process_article(cfg, creatify, smm, channel_label, agent, article_url):
    ch_cfg = cfg["youtube"]["channels"][channel_label]
    yt = build_youtube_client(ch_cfg["client_secret_path"], ch_cfg["token_path"])

    shot = creatify.build_short_from_article(
        article_url=article_url,
        name="Auto Short",
        overrides=None,
        target_audience=agent["target_audience"]
    )

    tmp_dir = tempfile.mkdtemp(prefix="creatify_")
    out_path = os.path.join(tmp_dir, shot["filename"])
    with open(out_path, "wb") as f:
        f.write(shot["video_bytes"])

    title = build_title(ch_cfg["title_prefix"], shot["filename"], cfg["youtube"]["title_max_len"])
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
    print(f"[{agent['label']} → {channel_label}] Uploaded:", vurl)

    pin = generate_pinned_comment(
        title=title, description=ch_cfg["default_description"], tags=ch_cfg["default_tags"], persona_hint=agent["label"]
    )
    replies = generate_custom_comments(
        title=title, description=ch_cfg["default_description"], tags=ch_cfg["default_tags"], n=2, persona_hint=agent["label"]
    )
    _, curl = create_top_comment(yt, vid, pin)
    print(f"[{agent['label']} → {channel_label}] Author comment:", curl)

    res = smm.boost_short(
        video_url=vurl,
        pin_comment_url=curl,
        reply_comment_url=curl,
        reply_texts=replies
    )
    print(f"[{agent['label']} → {channel_label}] SMM:", res)

def main():
    cfg = load_config()
    creatify, smm = build_clients(cfg)

    entries = parse_feed(cfg["rss"]["url"], max_items=int(cfg["rss"].get("max_fetch", 30)))
    entries = dedupe_recent(entries, window_hours=int(cfg["rss"].get("dedupe_hours", 48)))
    if not entries:
        print("No fresh items.")
        return

    per_channel = int(cfg["youtube"]["daily_per_channel"])

    for agent_name, agent in cfg["agents"].items():
        pool = filter_by_domains(entries, agent["allowed_domains"])
        if not pool:
            print(f"[{agent['label']}] No fresh items from allowed sources.")
            continue

        channels = agent["channels"]
        need = per_channel * len(channels)
        picks = pool[:need]

        i = 0
        for link_obj in picks:
            channel_label = channels[i % len(channels)]
            try:
                process_article(cfg, creatify, smm, channel_label, agent, link_obj["link"])
            except Exception as ex:
                print(f"[{agent['label']} → {channel_label}] Failed on {link_obj['link']}: {ex}")
            i += 1

if __name__ == "__main__":
    main()