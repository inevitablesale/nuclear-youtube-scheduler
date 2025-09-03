import { blobs } from "@netlify/blobs";
const NS = "nuclear-scheduler";

export async function setJson<T>(key: string, value: T) {
  const b = await blobs();
  await b.setJSON(`${NS}:${key}`, value);
}
export async function getJson<T>(key: string, fallback: T): Promise<T> {
  const b = await blobs();
  const v = await b.getJSON(`${NS}:${key}`);
  return (v as T) ?? fallback;
}
