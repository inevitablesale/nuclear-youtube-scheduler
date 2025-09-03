import axios from "axios";
const API = process.env.NUCLEAR_API_URL!;
const KEY = process.env.NUCLEAR_API_KEY!;

async function add(service:number, link:string, quantity:number, extra?:Record<string,any>) {
  const form = new URLSearchParams({ key: KEY, action: "add", service: String(service), link, quantity: String(quantity) });
  if (extra) Object.entries(extra).forEach(([k,v])=>form.append(k,String(v)));
  const { data } = await axios.post(API, form);
  return data;
}

export async function orderBundle(opts:{
  videoUrl:string, commentUrl:string,
  viewsQty:number, likesQty:number, pinLikesQty:number, commentsQty:number, commentsText?:string[]
}) {
  const out:any = {};
  out.views = await add(200, opts.videoUrl, opts.viewsQty);
  out.likes = await add(1217, opts.videoUrl, opts.likesQty);
  out.pin_likes = await add(115, opts.commentUrl, opts.pinLikesQty);
  if (opts.commentsQty>0) {
    const extra = opts.commentsText?.length ? { comments: opts.commentsText.join("\n") } : undefined;
    out.comments = await add(1117, opts.commentUrl, opts.commentsQty, extra);
  }
  return out;
}
