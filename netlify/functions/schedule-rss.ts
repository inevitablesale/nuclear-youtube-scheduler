import type { Handler } from "@netlify/functions";
export const handler: Handler = async () => {
  await fetch(`${process.env.URL}/.netlify/functions/worker`, { method: "POST" }); // fire-and-forget
  return { statusCode: 200, body: "Triggered background worker" };
};