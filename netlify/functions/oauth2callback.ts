import type { Handler } from "@netlify/functions";
import { google } from "googleapis";
import { getStore } from "@netlify/blobs";

function buildRedirectUrl(event: any) {
  const host = event.headers["x-forwarded-host"] || event.headers.host;
  const proto = (event.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  return `${proto}://${host}/.netlify/functions/oauth2callback`;
}

async function openOAuthStore() {
  try {
    // Works if Blobs is enabled for the site
    return await getStore("nuclear-oauth-refresh");
  } catch (e) {
    // Fallback: use explicit credentials from env
    const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
    const token = process.env.NETLIFY_API_TOKEN || process.env.NETLIFY_ACCESS_TOKEN;
    if (!siteID || !token) throw e;
    return await getStore({ name: "nuclear-oauth-refresh", siteID, token });
  }
}

export const handler: Handler = async (event) => {
  const code = event.queryStringParameters?.code;
  const channel = (event.queryStringParameters?.state || "A").toUpperCase();
  try {
    if (!code) return { statusCode: 400, body: "Missing code" };
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return { statusCode: 500, body: "Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET" };
    }

    const redirectUri = buildRedirectUrl(event);
    const oAuth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri
    );
    const { tokens } = await oAuth2.getToken(code);
    if (!tokens.refresh_token) {
      return { statusCode: 400, body: "No refresh_token; re-run connect (prompt=consent)" };
    }

    const store = await openOAuthStore();
    await store.setJSON(channel, { refresh_token: tokens.refresh_token, at: new Date().toISOString() });

    return { statusCode: 200, body: `OK – saved refresh token for channel ${channel}. You can close this tab.` };
  } catch (e: any) {
    console.error("oauth2callback error:", e?.response?.data || e?.message || e);
    return { statusCode: 500, body: String(e?.response?.data || e?.message || "oauth2callback error") };
  }
};