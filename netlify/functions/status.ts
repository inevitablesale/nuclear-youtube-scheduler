import type { Handler } from "@netlify/functions";
import { getJson } from "../utils/store";
export const handler: Handler = async () => {
  const lastRun = await getJson("lastRun", { at: null, items: [] });
  return { statusCode: 200, body: JSON.stringify({ lastRun }) };
};