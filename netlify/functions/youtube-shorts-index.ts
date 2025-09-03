import { Handler } from "@netlify/functions";
import { google } from "googleapis";
import { getRefreshToken, ensureMigrations } from "../utils/db";

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

    // Get recent videos and filter for Shorts
    const { data } = await yt.search.list({
      part: ["id","snippet"],
      forMine: true,
      type: ["video"],
      maxResults: 25,
      order: "date"
    });

    // Filter for Shorts (videos with #shorts in title or description)
    const shorts = data.items?.filter(item => 
      item.snippet?.title?.toLowerCase().includes('#shorts') ||
      item.snippet?.description?.toLowerCase().includes('#shorts')
    ) || [];

    // Get video details for Shorts
    const videoIds = shorts.map(s => s.id?.videoId).filter(Boolean);
    let shortsDetails: any[] = [];
    
    if (videoIds.length > 0) {
      const detailsResponse = await yt.videos.list({
        part: ["snippet", "statistics", "contentDetails"],
        id: videoIds.join(',')
      });
      shortsDetails = detailsResponse.data.items || [];
    }

    // Calculate Shorts metrics
    const shortsWithMetrics = shortsDetails.map(video => {
      const views = parseInt(video.statistics?.viewCount || '0');
      const publishedAt = new Date(video.snippet?.publishedAt || '');
      const daysSincePublished = Math.max(1, Math.floor((Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24)));
      
      return {
        videoId: video.id,
        title: video.snippet?.title,
        publishedAt: video.snippet?.publishedAt,
        views,
        likes: parseInt(video.statistics?.likeCount || '0'),
        comments: parseInt(video.statistics?.commentCount || '0'),
        duration: video.contentDetails?.duration,
        // Calculate velocity score (views per day since published)
        velocityScore: Math.round(views / daysSincePublished),
        // Estimate half-life (simplified - would need historical data for accurate calculation)
        estimatedHalfLife: Math.round(daysSincePublished * 0.3)
      };
    });

    return { 
      statusCode: 200, 
      body: JSON.stringify({
        channel,
        shorts: shortsWithMetrics,
        totalShorts: shortsWithMetrics.length
      })
    };
  } catch (e: any) {
    return { statusCode: 500, body: e.message || "shorts error" };
  }
};