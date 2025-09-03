import { Handler } from "@netlify/functions";
import { google } from "googleapis";
import { getRefreshToken, sql, ensureMigrations } from "../utils/db";

async function oauth(channel: "A"|"B") {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  const rt = await getRefreshToken(channel);
  if (!rt) throw new Error(`No refresh token for ${channel}`);
  auth.setCredentials({ refresh_token: rt });
  return auth;
}

export const handler: Handler = async (event) => {
  await ensureMigrations();
  const channel = (event.queryStringParameters?.channel || "A").toUpperCase() as "A"|"B";
  try {
    const auth = await oauth(channel);
    const yt = google.youtube({ version: "v3", auth });

    // mine=true returns the auth'd channel
    const { data } = await yt.channels.list({
      mine: true,
      part: ["snippet","statistics","contentDetails"]
    });

    const ch = data.items?.[0];
    if (!ch) throw new Error("No channel found");

    const uploadsPlaylistId = ch.contentDetails?.relatedPlaylists?.uploads;
    let lastVideo: any = null;
    if (uploadsPlaylistId) {
      const pl = await yt.playlistItems.list({
        playlistId: uploadsPlaylistId,
        part: ["snippet","contentDetails"],
        maxResults: 1
      });
      const it = pl.data.items?.[0];
      if (it) {
        lastVideo = {
          videoId: it.contentDetails?.videoId,
          title: it.snippet?.title,
          publishedAt: it.contentDetails?.videoPublishedAt
        };
      }
    }

    // Persist channel id/title/handle for convenience
    await sql`
      insert into channels (label, youtube_channel_id, title, handle, country)
      values (${channel}, ${ch.id || null}, ${ch.snippet?.title || null}, ${ch.snippet?.customUrl || null}, ${ch.snippet?.country || null})
      on conflict (label) do update set
        youtube_channel_id = excluded.youtube_channel_id,
        title = excluded.title,
        handle = excluded.handle,
        country = excluded.country`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        channel,
        id: ch.id,
        title: ch.snippet?.title,
        handle: ch.snippet?.customUrl,
        country: ch.snippet?.country,
        subscribers: ch.statistics?.subscriberCount,
        totalViews: ch.statistics?.viewCount,
        videoCount: ch.statistics?.videoCount,
        lastVideo
      })
    };
  } catch (e:any) {
    return { statusCode: 500, body: e.message || "channel-info error" };
  }
};