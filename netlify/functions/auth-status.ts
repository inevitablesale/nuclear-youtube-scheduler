import type { Handler } from "@netlify/functions";
import { ensureMigrations, getRefreshToken } from "../utils/db";

export const handler: Handler = async () => {
  await ensureMigrations();
  const A = !!(await getRefreshToken("A"));
  const B = !!(await getRefreshToken("B"));
  return { statusCode: 200, body: JSON.stringify({ ok:true, authorized:{ A, B } }) };
};