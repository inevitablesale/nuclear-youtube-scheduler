import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { google } from "googleapis";

export const handler: Handler = async (event) => {
  const code = event.queryStringParameters?.code;
  const channel = (event.queryStringParameters?.state || "A").toUpperCase();
  if (!code) return { statusCode: 400, body: "Missing code" };

  const oAuth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${process.env.URL}/.netlify/functions/oauth2callback`
  );

  const { tokens } = await oAuth2.getToken(code);
  const refresh = tokens.refresh_token;
  if (!refresh) return { statusCode: 400, body: "No refresh_token; run again (we force prompt=consent)" };

  const store = await getStore("nuclear-oauth-refresh");
  await store.setJSON(channel, { refresh_token: refresh, at: new Date().toISOString() });

  return { statusCode: 200, body: `OK – saved refresh token for channel ${channel}. You can close this tab.` };
};