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

    const result = await yta.reports.query({
      ids: `channel==${channelId}`,
      startDate: toISO(start),
      endDate: toISO(end),
      metrics: "views,likes,comments,subscribersGained",
      dimensions: "insightTrafficSourceType",
      sort: "-views"
    });

    for (const row of result.data.rows || []) {
      const [source, views, likes, comments, subsGained] = row;
      await sql`
        insert into analytics_traffic_sources (channel_label, source, views, likes, comments, subs_gained, date)
        values (${channel}, ${source}, ${views}, ${likes}, ${comments}, ${subsGained}, current_date)
        on conflict do nothing
      `;
    }

    return { statusCode: 200, body: JSON.stringify(result.data.rows || []) };
  } catch (e: any) {
    return { statusCode: 500, body: e.message || "traffic error" };
  }
};