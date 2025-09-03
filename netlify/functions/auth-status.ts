import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

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

export const handler: Handler = async () => {
  try {
    const store = await openOAuthStore();
    const a = await store.getJSON<{refresh_token:string}>("A");
    const b = await store.getJSON<{refresh_token:string}>("B");
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        authorized: {
          A: !!a?.refresh_token,
          B: !!b?.refresh_token,
        },
      }),
    };
  } catch (e: any) {
    return {
      statusCode: 200, // keep UI happy; report not authorized instead of 5xx
      body: JSON.stringify({
        ok: false,
        error: e?.message || "auth-status error",
        authorized: { A: false, B: false },
      }),
    };
  }
};