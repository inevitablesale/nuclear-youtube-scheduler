import type { Handler } from "@netlify/functions";
import { getJson } from "../utils/store";

export const handler: Handler = async () => {
  try {
    const lastRun = await getJson("lastRun", { at: null, items: [] });
    return { statusCode: 200, body: JSON.stringify({ lastRun }) };
  } catch (e: any) {
    // Never 5xx to the UI; return an empty payload
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        lastRun: { at: null, items: [] }, 
        error: e?.message || "status error" 
      }) 
    };
  }
};