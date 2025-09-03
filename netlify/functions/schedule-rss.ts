import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  // Fire-and-forget call to the background worker
  await fetch(`${process.env.URL}/.netlify/functions/worker`, { method: "POST" });
  return { statusCode: 200, body: "Triggered background worker" };
};