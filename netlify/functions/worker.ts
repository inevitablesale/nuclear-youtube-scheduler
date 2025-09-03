import type { Handler } from "@netlify/functions";
import { fetchFeed, routeByAgent } from "../utils/rss";
import { buildShortFromArticle } from "../utils/creatify";
import { uploadShortFromUrl, postAuthorComment } from "../utils/youtube";
import { orderBundle } from "../utils/smm";
import { setJson, getJson } from "../utils/store";
import OpenAI from "openai";

const OA_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const DAILY = Number(process.env.DAILY_PER_CHANNEL || 2);
const RSS_URL = process.env.RSS_URL!;

const AVA_AUDIENCE = `You are Ava, Group Dealer Strategist. You're sharp, analytical, and think big-picture about automotive SEO. You understand the complexities of multi-location dealership groups and how to scale SEO strategies across markets. Your insights are data-driven and focus on ROI, conversion optimization, and competitive positioning. You speak with authority about technical SEO, local search, and the unique challenges dealers face in today's digital landscape.`;

const MAYA_AUDIENCE = `You are Maya, OEM Program Insider. You're professional, polished, and structured in your approach to automotive SEO. You have deep knowledge of manufacturer programs, dealer compliance requirements, and how to navigate the complex relationship between OEMs and their dealer networks. Your expertise spans brand guidelines, co-op advertising, and the delicate balance of maintaining brand consistency while driving local performance. You're methodical, detail-oriented, and excel at translating complex OEM requirements into actionable SEO strategies.`;

function commentPrompt(title:string, persona:string){
  return `${persona}\n\nWrite a <140 char top comment inviting engagement for a Short titled: ${title}\nReturn only the text.`;
}

function repliesPrompt(title:string, persona:string){
  return `${persona}\n\nWrite 2 short natural viewer replies (<120 chars each) for a Short titled: ${title}. Return JSON array of strings.`;
}

export const handler: Handler = async () => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const feed = await fetchFeed(RSS_URL, 30);
  const { Ava, Maya } = routeByAgent(feed);
  const picksA = Ava.slice(0, DAILY);
  const picksB = Maya.slice(0, DAILY);

  const lastRun = { at: new Date().toISOString(), items: [] as any[] };

  // Channel A (Ava)
  for (const e of picksA) {
    const short = await buildShortFromArticle(e.link, AVA_AUDIENCE, 15);
    const title = `Automotive SEO • ${new URL(e.link).hostname}`;
    const up = await uploadShortFromUrl("A", short.videoUrl, title, "Quick automotive SEO tips. #Shorts", ["automotive seo","dealer seo","shorts"]);

    const pin = await openai.chat.completions.create({ 
      model: OA_MODEL, 
      messages: [{ role: "user", content: commentPrompt(title, "Ava – sharp, analytical, big-picture") }], 
      temperature: 0.7, 
      max_tokens: 80 
    });
    const commentUrl = await postAuthorComment("A", up.videoId, pin.choices[0].message.content!.trim());

    const replies = await openai.chat.completions.create({ 
      model: OA_MODEL, 
      messages: [{ role: "user", content: repliesPrompt(title, "Ava – sharp, analytical, big-picture") }], 
      temperature: 0.8, 
      max_tokens: 160 
    });
    let replyArr: string[] = [];
    try { replyArr = JSON.parse(replies.choices[0].message.content || "[]"); } catch {}

    const orders = await orderBundle({
      videoUrl: up.watchUrl, commentUrl,
      viewsQty: 500, likesQty: 15, pinLikesQty: 15, commentsQty: 2, commentsText: replyArr
    });

    lastRun.items.push({ channel: "A", article: e.link, video: up.watchUrl, commentUrl, orders });
  }

  // Channel B (Maya)
  for (const e of picksB) {
    const short = await buildShortFromArticle(e.link, MAYA_AUDIENCE, 15);
    const title = `Auto SEO Tip • ${new URL(e.link).hostname}`;
    const up = await uploadShortFromUrl("B", short.videoUrl, title, "Daily automotive SEO plays. #Shorts", ["seo","car dealers","shorts"]);

    const pin = await openai.chat.completions.create({ 
      model: OA_MODEL, 
      messages: [{ role: "user", content: commentPrompt(title, "Maya – professional, polished, structured") }], 
      temperature: 0.7, 
      max_tokens: 80 
    });
    const commentUrl = await postAuthorComment("B", up.videoId, pin.choices[0].message.content!.trim());

    const replies = await openai.chat.completions.create({ 
      model: OA_MODEL, 
      messages: [{ role: "user", content: repliesPrompt(title, "Maya – professional, polished, structured") }], 
      temperature: 0.8, 
      max_tokens: 160 
    });
    let replyArr: string[] = [];
    try { replyArr = JSON.parse(replies.choices[0].message.content || "[]"); } catch {}

    const orders = await orderBundle({
      videoUrl: up.watchUrl, commentUrl,
      viewsQty: 500, likesQty: 15, pinLikesQty: 15, commentsQty: 2, commentsText: replyArr
    });

    lastRun.items.push({ channel: "B", article: e.link, video: up.watchUrl, commentUrl, orders });
  }

  await setJson("lastRun", lastRun);
  return { statusCode: 200, body: JSON.stringify({ ok: true, lastRunCount: lastRun.items.length }) };
};
