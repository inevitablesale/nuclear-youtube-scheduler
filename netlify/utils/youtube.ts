import { google } from "googleapis";
import axios from "axios";
import fs from "fs/promises";
import { getRefreshToken } from "./db";

type Chan = "A"|"B";

export async function getAuthorizedClient(channel: "A"|"B") {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) throw new Error("Missing Google envs");
  const oauth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  const refresh = await getRefreshToken(channel);
  if (!refresh) throw new Error(`No refresh_token for channel ${channel}`);
  oauth.setCredentials({ refresh_token: refresh });
  return oauth;
}

export async function youtubeClient(chan: Chan) {
  const oauth = await getAuthorizedClient(chan);
  return google.youtube({ version: "v3", auth: oauth });
}

export async function uploadShortFromUrl(chan: Chan, fileUrl: string, title: string, description: string, tags: string[], categoryId = "27") {
  const yt = await youtubeClient(chan);
  const buf = await axios.get<ArrayBuffer>(fileUrl, { responseType: "arraybuffer" }).then(r => Buffer.from(r.data));
  const tmp = `/tmp/${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`;
  await fs.writeFile(tmp, buf);

  const res = await yt.videos.insert({
    part: ["snippet","status"],
    requestBody: { snippet: { title, description, tags, categoryId }, status: { privacyStatus:"public", selfDeclaredMadeForKids:false, madeForKids:false } },
    media: { body: (await import("fs")).createReadStream(tmp) }
  });
  const id = res.data.id!;
  return { videoId: id, watchUrl: `https://youtube.com/shorts/${id}` };
}

export async function postAuthorComment(chan: Chan, videoId: string, text: string) {
  const yt = await youtubeClient(chan);
  const resp = await yt.commentThreads.insert({
    part: ["snippet"],
    requestBody: { snippet: { videoId, topLevelComment: { snippet: { textOriginal: text } } } }
  });
  const cid = resp.data.id!;
  return `https://www.youtube.com/watch?v=${videoId}&lc=${cid}`;
}