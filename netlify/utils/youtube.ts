import { google } from "googleapis";
import axios from "axios";
import fs from "fs/promises";
import { getJson } from "./store";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

type Chan = "A"|"B";

async function oauth(chan: Chan) {
  const tokens = await getJson(`yt${chan}_tokens`, null);
  if (!tokens) {
    throw new Error(`YouTube Channel ${chan} not authorized. Please complete OAuth flow.`);
  }
  
  const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  oAuth2Client.setCredentials(tokens);
  return oAuth2Client;
}

export async function uploadShortFromUrl(chan: Chan, fileUrl: string, title: string, description: string, tags: string[], categoryId = "27"): Promise<{videoId:string, watchUrl:string}> {
  const auth = await oauth(chan);
  const yt = google.youtube({ version: "v3", auth });

  const buf = await axios.get<ArrayBuffer>(fileUrl, { responseType: "arraybuffer" }).then(r => Buffer.from(r.data));
  const tmp = `/tmp/${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`;
  await fs.writeFile(tmp, buf);

  const res = await yt.videos.insert({
    part: ["snippet","status"],
    requestBody: {
      snippet: { title, description, tags, categoryId },
      status: { privacyStatus: "public", selfDeclaredMadeForKids: false, madeForKids: false }
    },
    media: { body: (await import("fs")).createReadStream(tmp) }
  });
  const id = res.data.id!;
  return { videoId: id, watchUrl: `https://youtube.com/shorts/${id}` };
}

export async function postAuthorComment(chan: Chan, videoId: string, text: string): Promise<string> {
  const auth = await oauth(chan);
  const yt = google.youtube({ version: "v3", auth });
  const resp = await yt.commentThreads.insert({
    part: ["snippet"],
    requestBody: {
      snippet: {
        videoId,
        topLevelComment: { snippet: { textOriginal: text } }
      }
    }
  });
  const cid = resp.data.id!;
  return `https://www.youtube.com/watch?v=${videoId}&lc=${cid}`;
}
