import { getStore } from "@netlify/blobs";

const NS = "nuclear-scheduler";

export async function setJson<T>(key: string, value: T) {
  const store = await getStore(NS);
  await store.setJSON(key, value);
}

export async function getJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const store = await getStore(NS);
    const v = await store.getJSON(key);
    return (v as T) ?? fallback;
  } catch {
    return fallback;
  }
}
