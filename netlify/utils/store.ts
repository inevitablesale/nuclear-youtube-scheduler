import { blobs } from "@netlify/blobs";

const NAMESPACE = "nuclear-scheduler";

export async function setJson<T>(key: string, value: T) {
  const blob = await blobs();
  await blob.setJSON(`${NAMESPACE}:${key}`, value);
}

export async function getJson<T>(key: string, fallback: T): Promise<T> {
  const blob = await blobs();
  const v = await blob.getJSON(`${NAMESPACE}:${key}`);
  return (v as T) ?? fallback;
}
