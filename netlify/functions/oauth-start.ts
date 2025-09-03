import type { Handler } from "@netlify/functions";
import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.force-ssl",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/yt-analytics-monetary.readonly",
];

export const handler: Handler = async (event) => {
  const client_id = process.env.GOOGLE_CLIENT_ID!;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${process.env.URL}/.netlify/functions/oauth2callback`;
  const channel = event.queryStringParameters?.channel || "A";

  const oAuth2 = new google.auth.OAuth2(client_id, client_secret, redirectUri);
  const url = oAuth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: SCOPES,
    state: channel
  });

  return { statusCode: 302, headers: { Location: url }, body: "" };
};