import type { Handler } from "@netlify/functions";
import { fetchFeed, routeByAgent } from "../utils/rss";
import { getJson } from "../utils/db";

export const handler: Handler = async () => {
  try {
    const RSS_URL = process.env.RSS_URL;
    if (!RSS_URL) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "RSS_URL not configured" })
      };
    }

    // Fetch the RSS feed
    const feed = await fetchFeed(RSS_URL, 40);
    
    // Route articles by agent
    const { Ava, Maya } = routeByAgent(feed);
    
    // Get seen articles to show which ones have been processed
    const seen = await getJson<Record<string, string>>("seen-articles", {});
    
    // Mark articles as seen/processed
    const processedArticles = new Set(Object.keys(seen));
    
    // Add processing status to articles
    const addStatus = (articles: any[]) => articles.map(article => ({
      ...article,
      processed: processedArticles.has(article.link),
      processedAt: seen[article.link] || null
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        totalArticles: feed.length,
        channelA: {
          name: "Ava (Tech Channel)",
          articles: addStatus(Ava),
          count: Ava.length
        },
        channelB: {
          name: "Maya (Creative Channel)", 
          articles: addStatus(Maya),
          count: Maya.length
        },
        unassigned: {
          articles: addStatus(feed.filter(article => 
            !Ava.some(a => a.link === article.link) && 
            !Maya.some(m => m.link === article.link)
          )),
          count: feed.filter(article => 
            !Ava.some(a => a.link === article.link) && 
            !Maya.some(m => m.link === article.link)
          ).length
        },
        lastUpdated: new Date().toISOString()
      })
    };
  } catch (error: any) {
    console.error("RSS feed error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message || "Failed to fetch RSS feed",
        success: false 
      })
    };
  }
};