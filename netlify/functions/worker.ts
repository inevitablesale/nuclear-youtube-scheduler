import type { Handler } from "@netlify/functions";
import { fetchFeed, routeByAgent } from "../utils/rss";
import { buildShortFromArticle } from "../utils/creatify";
import { uploadShortFromUrl, postAuthorComment } from "../utils/youtube";
import { orderBundle } from "../utils/smm";
import { setJson, getJson, ensureMigrations } from "../utils/db";
import OpenAI from "openai";

const OA_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const DAILY = Number(process.env.DAILY_PER_CHANNEL || 2);
const RSS_URL = process.env.RSS_URL!;

const AVA_AUDIENCE = `You are Ava, Group Dealer Strategist...`;
const MAYA_AUDIENCE = `You are Maya, OEM Program Insider...`;

const seenWindowDays = 5;

export const handler: Handler = async () => {
  await ensureMigrations();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const seen = await getJson<Record<string,string>>("seen-articles", {});
  const cutoff = Date.now() - seenWindowDays*86400000;

  const feed = await fetchFeed(RSS_URL, 40);
  const { Ava, Maya } = routeByAgent(feed);

  const pickFresh = (arr:any[]) =>
    arr.filter(e => !seen[e.link] || Date.parse(seen[e.link]) < cutoff).slice(0, DAILY);

  const picksA = pickFresh(Ava);
  const picksB = pickFresh(Maya);

  const lastRun = { at: new Date().toISOString(), items: [] as any[] };

  async function doOne(chan:"A"|"B", article:string, persona:string, audience:string, titlePrefix:string, desc:string, tags:string[]) {
    const short = await buildShortFromArticle(article, audience, 15);
    const title = `${titlePrefix}${new URL(article).hostname}`;
    const up = await uploadShortFromUrl(chan, short.videoUrl, title, desc, tags);

    const pin = await openai.chat.completions.create({
      model: OA_MODEL,
      messages: [{ role: "user", content: `${persona}\nWrite a <140 char top comment inviting engagement for a Short titled: ${title}\nReturn only the text.` }],
      temperature: 0.7, max_tokens: 80
    });
    const commentUrl = await postAuthorComment(chan, up.videoId, pin.choices[0].message.content!.trim());

    const replies = await openai.chat.completions.create({
      model: OA_MODEL,
      messages: [{ role: "user", content: `${persona}\nWrite 2 viewer replies (<120 chars each) for a Short titled: ${title}. Return JSON array of strings.` }],
      temperature: 0.8, max_tokens: 160
    });
    let replyArr: string[] = [];
    try { replyArr = JSON.parse(replies.choices[0].message.content || "[]"); } catch {}

    const orders = await orderBundle({
      videoUrl: up.watchUrl, commentUrl,
      viewsQty: 500, likesQty: 15, pinLikesQty: 15, commentsQty: 2, commentsText: replyArr
    });

    lastRun.items.push({ channel: chan, article, video: up.watchUrl, commentUrl, orders });
    seen[article] = new Date().toISOString();
  }

  for (const e of picksA) {
    await doOne("A", e.link, "Ava – sharp, analytical, big-picture", AVA_AUDIENCE,
      "Automotive SEO • ", "Quick automotive SEO tips. #Shorts", ["automotive seo","dealer seo","shorts"]);
  }
  for (const e of picksB) {
    await doOne("B", e.link, "Maya – professional, polished, structured", MAYA_AUDIENCE,
      "Auto SEO Tip • ", "Daily automotive SEO plays. #Shorts", ["seo","car dealers","shorts"]);
  }

  await setJson("lastRun", lastRun);
  await setJson("seen-articles", seen);
  return { statusCode: 200, body: JSON.stringify({ ok: true, posted: lastRun.items.length }) };
};