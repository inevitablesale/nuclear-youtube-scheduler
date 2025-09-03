import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  await fetch(`${process.env.URL}/.netlify/functions/worker`, { method: "POST" });
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};