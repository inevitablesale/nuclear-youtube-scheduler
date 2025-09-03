import type { Handler } from "@netlify/functions";
import { google } from "googleapis";
import { ensureMigrations, setRefreshToken } from "../utils/db";

const redirectUrl = (e:any) => {
  const host = e.headers["x-forwarded-host"] || e.headers.host;
  const proto = (e.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  return `${proto}://${host}/.netlify/functions/oauth2callback`;
};

export const handler: Handler = async (event) => {
  await ensureMigrations();
  const code = event.queryStringParameters?.code;
  const channel = (event.queryStringParameters?.state || "A").toUpperCase() as "A"|"B";
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!code) return { statusCode: 400, body: "Missing code" };
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return { statusCode: 500, body: "Missing Google envs" };

  try {
    const oauth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUrl(event));
    const { tokens } = await oauth.getToken(code);
    if (!tokens.refresh_token) return { statusCode: 400, body: "No refresh_token; rerun with prompt=consent" };
    await setRefreshToken(channel, tokens.refresh_token);
    return { statusCode: 200, body: `OK – saved refresh token for ${channel}` };
  } catch (e:any) {
    console.error("oauth2callback error:", e?.response?.data || e?.message || e);
    return { statusCode: 500, body: String(e?.response?.data || e?.message || "oauth2callback error") };
  }
};