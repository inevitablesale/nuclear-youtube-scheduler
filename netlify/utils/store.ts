import { getStore } from "@netlify/blobs";

const NS = "nuclear-scheduler";

async function openStore(name = NS) {
  try {
    // Works if Blobs is enabled for the site
    return await getStore(name);
  } catch (e) {
    // Fallback: use explicit credentials from env
    const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
    const token = process.env.NETLIFY_API_TOKEN || process.env.NETLIFY_ACCESS_TOKEN;
    if (!siteID || !token) throw e;
    return await getStore({ name, siteID, token });
  }
}

export async function setJson<T>(key: string, value: T) {
  const store = await openStore();
  await store.setJSON(key, value);
}

export async function getJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const store = await openStore();
    const v = await store.getJSON(key);
    return (v as T) ?? fallback;
  } catch {
    return fallback;
  }
}
