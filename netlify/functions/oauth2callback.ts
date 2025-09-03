import type { Handler } from "@netlify/functions";
import { google } from "googleapis";
import { setJson } from "../utils/store";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = "https://nuclear-youtube-scheduler.netlify.app/.netlify/functions/oauth2callback";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.force-ssl", 
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/yt-analytics-monetary.readonly"
];

export const handler: Handler = async (event) => {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  if (event.httpMethod === "GET") {
    // Handle OAuth callback
    const { code, state } = event.queryStringParameters || {};
    
    if (!code) {
      return {
        statusCode: 400,
        body: "Missing authorization code"
      };
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Get channel info to determine which channel this is for
      const youtube = google.youtube({ version: "v3", auth: oauth2Client });
      const channelResponse = await youtube.channels.list({
        part: ["snippet", "statistics"],
        mine: true
      });

      const channel = channelResponse.data.items?.[0];
      if (!channel) {
        return {
          statusCode: 400,
          body: "No YouTube channel found"
        };
      }

      const channelId = channel.id!;
      const channelTitle = channel.snippet?.title || "Unknown Channel";
      
      // Store tokens based on channel (A or B)
      const channelKey = state === "channelB" ? "B" : "A";
      await setJson(`yt${channelKey}_tokens`, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date
      });

      await setJson(`yt${channelKey}_channel`, {
        id: channelId,
        title: channelTitle,
        subscriberCount: channel.statistics?.subscriberCount,
        videoCount: channel.statistics?.videoCount
      });

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/html"
        },
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1>✅ YouTube Authorization Successful!</h1>
              <p><strong>Channel:</strong> ${channelTitle}</p>
              <p><strong>Channel ID:</strong> ${channelId}</p>
              <p><strong>Configured as:</strong> Channel ${channelKey}</p>
              <p>You can now close this window and return to your dashboard.</p>
              <p>The refresh token has been securely stored and will be used for automated uploads.</p>
            </body>
          </html>
        `
      };
    } catch (error) {
      console.error("OAuth error:", error);
      return {
        statusCode: 500,
        body: `OAuth error: ${error}`
      };
    }
  }

  // Handle OAuth initiation
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: event.queryStringParameters?.state || "channelA"
  });

  return {
    statusCode: 302,
    headers: {
      Location: authUrl
    }
  };
};
