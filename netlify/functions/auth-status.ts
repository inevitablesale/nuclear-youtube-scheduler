import type { Handler } from "@netlify/functions";
import { blobs } from "@netlify/blobs";

export const handler: Handler = async () => {
  try {
    const b = await blobs();
    const a = await b.getJSON<{refresh_token:string}>("nuclear-oauth-refresh:A");
    const c = await b.getJSON<{refresh_token:string}>("nuclear-oauth-refresh:B");
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        authorized: {
          A: !!a?.refresh_token,
          B: !!c?.refresh_token,
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