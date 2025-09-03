import { Handler } from "@netlify/functions";
import { google } from "googleapis";
import { getRefreshToken } from "../utils/db";

function toISO(d: Date) { return d.toISOString().slice(0,10); }

async function oauth(channel: "A"|"B") {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  const rt = await getRefreshToken(channel);
  if (!rt) throw new Error(`No refresh token for ${channel}`);
  auth.setCredentials({ refresh_token: rt });
  return auth;
}

export const handler: Handler = async (event) => {
  const channel = (event.queryStringParameters?.channel || "A").toUpperCase() as "A"|"B";
  try {
    const auth = await oauth(channel);
    const yt = google.youtube({ version: "v3", auth });
    const yta = google.youtubeAnalytics({ version: "v2", auth });

    // Need channel ID for analytics "ids=channel==ID"
    const ch = await yt.channels.list({ mine: true, part: ["id"] });
    const channelId = ch.data.items?.[0]?.id;
    if (!channelId) throw new Error("No channel id");

    const end = new Date();                       // today
    const start = new Date(); start.setDate(end.getDate() - 28);
    const ids = `channel==${channelId}`;

    // KPIs (total)
    const metrics = [
      "views","likes","comments","shares",
      "subscribersGained","subscribersLost","estimatedMinutesWatched",
      "averageViewDuration","averageViewPercentage"
    ].join(",");

    const kpis = await yta.reports.query({
      ids, startDate: toISO(start), endDate: toISO(end),
      metrics
    });

    // Daily time series (views, watch time, subs net)
    const daily = await yta.reports.query({
      ids, startDate: toISO(start), endDate: toISO(end),
      metrics: "views,estimatedMinutesWatched,subscribersGained,subscribersLost",
      dimensions: "day",
      sort: "day"
    });

    // Top videos (last 28d)
    const topVideos = await yta.reports.query({
      ids, startDate: toISO(start), endDate: toISO(end),
      metrics: "views,estimatedMinutesWatched,averageViewDuration",
      dimensions: "video",
      sort: "-views",
      maxResults: 5
    });

    // Traffic sources breakdown
    const traffic = await yta.reports.query({
      ids, startDate: toISO(start), endDate: toISO(end),
      metrics: "views,estimatedMinutesWatched",
      dimensions: "insightTrafficSourceType",
      sort: "-views"
    });

    // Search terms (if any)
    const searchTerms = await yta.reports.query({
      ids, startDate: toISO(start), endDate: toISO(end),
      metrics: "views",
      dimensions: "insightTrafficSourceDetail",
      filters: "insightTrafficSourceType==YT_SEARCH",
      sort: "-views",
      maxResults: 10
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        channel,
        range: { start: toISO(start), end: toISO(end) },
        kpis: kpis.data.rows?.[0] || [],
        daily: daily.data.rows || [],
        topVideos: topVideos.data.rows || [],
        traffic: traffic.data.rows || [],
        searchTerms: searchTerms.data.rows || []
      })
    };
  } catch (e:any) {
    return { statusCode: 500, body: e.message || "youtube-analytics error" };
  }
};