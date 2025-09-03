import { google } from "googleapis";
import axios from "axios";
import fs from "fs/promises";
import { getStore } from "@netlify/blobs";

type Chan = "A"|"B";

async function refreshToken(chan: Chan) {
  const store = await getStore("nuclear-oauth-refresh");
  const rec = await store.getJSON<{ refresh_token: string }>(chan);
  if (!rec?.refresh_token) throw new Error(`No refresh_token for channel ${chan}. Run OAuth connect.`);
  return rec.refresh_token;
}

export async function youtubeClient(chan: Chan) {
  const rt = await refreshToken(chan);
  const oAuth2 = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID!, process.env.GOOGLE_CLIENT_SECRET!);
  oAuth2.setCredentials({ refresh_token: rt });
  return google.youtube({ version: "v3", auth: oAuth2 });
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