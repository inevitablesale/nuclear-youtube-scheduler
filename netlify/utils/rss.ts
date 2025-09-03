import axios from "axios";
import { parseStringPromise } from "xml2js";

export type Entry = { title: string; link: string; date?: number };

export async function fetchFeed(url: string, max = 30): Promise<Entry[]> {
  const { data } = await axios.get(url, { timeout: 15000 });
  const xml = await parseStringPromise(data);
  const items: any[] = xml.feed?.entry ?? xml.rss?.channel?.[0]?.item ?? [];
  const out: Entry[] = items.slice(0, max).map((e:any) => ({
    title: (e.title?.[0]?._ || e.title?.[0] || "").trim(),
    link: (e.link?.[0]?.$.href || e.link?.[0] || e.id?.[0] || "").trim(),
    date: Date.parse(e.updated?.[0] || e.published?.[0] || e.pubDate?.[0] || "") || undefined
  })).filter(e => e.link && e.title);
  out.sort((a,b)=>(b.date??0)-(a.date??0));
  return out;
}

export function routeByAgent(entries: Entry[]) {
  const ava = ["ahrefs.com","moz.com","seo.com"];
  const maya = ["developers.google.com","blog.google","searchengineland.com","seroundtable.com"];
  const belongs = (u:string, list:string[]) => list.some(d => u.includes(d));
  return {
    Ava: entries.filter(e => belongs(e.link, ava)),
    Maya: entries.filter(e => belongs(e.link, maya)),
  };
}
