import { Handler } from "@netlify/functions";
import { google } from "googleapis";
import { getRefreshToken, sql, ensureMigrations } from "../utils/db";

function toISO(d: Date) { return d.toISOString().slice(0, 10); }

async function oauth(channel: "A" | "B") {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  const rt = await getRefreshToken(channel);
  if (!rt) throw new Error(`No refresh token for ${channel}`);
  auth.setCredentials({ refresh_token: rt });
  return auth;
}

export const handler: Handler = async (event) => {
  await ensureMigrations();
  const channel = (event.queryStringParameters?.channel || "A").toUpperCase() as "A" | "B";
  try {
    const auth = await oauth(channel);
    const yt = google.youtube({ version: "v3", auth });
    const yta = google.youtubeAnalytics({ version: "v2", auth });

    const ch = await yt.channels.list({ mine: true, part: ["id"] });
    const channelId = ch.data.items?.[0]?.id;
    if (!channelId) throw new Error("No channel ID");

    const end = new Date();  
    const start = new Date(); start.setDate(end.getDate() - 28);

    // Get basic video metrics instead of retention (retention requires specific video IDs)
    const result = await yta.reports.query({
      ids: `channel==${channelId}`,
      startDate: toISO(start),
      endDate: toISO(end),
      metrics: "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage",
      dimensions: "video",
      sort: "-views",
      maxResults: 10
    });

    // persist in Neon (store video performance data)
    for (const row of result.data.rows || []) {
      const [videoId, views, minutesWatched, avgDuration, avgPercentage] = row;
      await sql`
        insert into analytics_retention (channel_label, video_id, time_offset_seconds, audience_watch_ratio, relative_performance)
        values (${channel}, ${videoId}, 0, ${avgPercentage || 0}, ${views || 0})
        on conflict do nothing
      `;
    }

    return { statusCode: 200, body: JSON.stringify(result.data.rows || []) };
  } catch (e: any) {
    return { statusCode: 500, body: e.message || "retention error" };
  }
};