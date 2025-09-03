import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export const handler: Handler = async () => {
  try {
    const store = await getStore("nuclear-oauth-refresh");
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