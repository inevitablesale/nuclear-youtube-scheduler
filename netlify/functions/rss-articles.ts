import type { Handler } from "@netlify/functions";
import { fetchFeed, routeByAgent } from "../utils/rss";
import { getJson } from "../utils/db";

export const handler: Handler = async (event) => {
  try {
    const channel = (event.queryStringParameters?.channel || "all").toUpperCase();
    const RSS_URL = process.env.RSS_URL;
    
    if (!RSS_URL) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "RSS_URL not configured" })
      };
    }

    // Fetch the RSS feed
    const feed = await fetchFeed(RSS_URL, 50);
    
    // Route articles by agent
    const { Ava, Maya } = routeByAgent(feed);
    
    // Get seen articles and last run data
    const seen = await getJson<Record<string, string>>("seen-articles", {});
    const lastRun = await getJson("lastRun", { at: null, items: [] });
    
    // Mark articles as seen/processed
    const processedArticles = new Set(Object.keys(seen));
    
    // Add processing status and metadata to articles
    const addMetadata = (articles: any[]) => articles.map(article => {
      const isProcessed = processedArticles.has(article.link);
      const processedAt = seen[article.link] || null;
      
      // Check if this article was used in the last run
      const lastRunUsage = lastRun.items?.find((item: any) => item.article === article.link);
      
      return {
        ...article,
        processed: isProcessed,
        processedAt,
        usedInLastRun: !!lastRunUsage,
        lastRunChannel: lastRunUsage?.channel || null,
        videoUrl: lastRunUsage?.video || null,
        commentUrl: lastRunUsage?.commentUrl || null,
        orders: lastRunUsage?.orders || null
      };
    });

    // Filter by channel if specified
    if (channel === "A") {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          channel: "A",
          channelName: "Ava (Tech Channel)",
          articles: addMetadata(Ava),
          count: Ava.length,
          lastUpdated: new Date().toISOString()
        })
      };
    } else if (channel === "B") {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          channel: "B", 
          channelName: "Maya (Creative Channel)",
          articles: addMetadata(Maya),
          count: Maya.length,
          lastUpdated: new Date().toISOString()
        })
      };
    } else {
      // Return all articles with routing info
      const unassigned = feed.filter(article => 
        !Ava.some(a => a.link === article.link) && 
        !Maya.some(m => m.link === article.link)
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          channel: "all",
          totalArticles: feed.length,
          channelA: {
            name: "Ava (Tech Channel)",
            articles: addMetadata(Ava),
            count: Ava.length
          },
          channelB: {
            name: "Maya (Creative Channel)",
            articles: addMetadata(Maya), 
            count: Maya.length
          },
          unassigned: {
            articles: addMetadata(unassigned),
            count: unassigned.length
          },
          lastUpdated: new Date().toISOString()
        })
      };
    }
  } catch (error: any) {
    console.error("RSS articles error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message || "Failed to fetch RSS articles",
        success: false 
      })
    };
  }
};