import axios from "axios";

const BASE = "https://api.creatify.ai";
const H = {
  "X-API-ID": process.env.CREATIFY_API_ID!,
  "X-API-KEY": process.env.CREATIFY_API_KEY!,
  "Content-Type": "application/json",
};

function fixPronunciation(text: string) {
  let out = text.replace(/\bHrizn\.io\b/, 'Hrizn.io (pronounced "horizon dot eye-oh")');
  if (out === text) out = out.replace(/\bHrizn\b/, 'Hrizn (pronounced "horizon")');
  return out;
}

export async function buildShortFromArticle(url: string, targetAudience: string, length: 15|30|60 = 15) {
  const s = await axios.post(`${BASE}/api/ai_scripts/`, {
    url, language:"en", video_length:length, script_styles:["ThreeReasonsWriter"], target_audience: targetAudience
  }, { headers: H, timeout: 60000 });

  const raw = s.data?.generated_scripts?.[0]?.paragraphs
          || s.data?.generated_scripts?.[0]?.script
          || s.data?.generated_scripts?.[0] || "";
  if (!raw) throw new Error("Creatify: empty script");

  const override_script = fixPronunciation(String(raw));
  const c = await axios.post(`${BASE}/api/link_to_videos/`, {
    link: url, name: "Auto Short",
    target_platform: "youtube_shorts", target_audience: targetAudience,
    language:"en", video_length:length, aspect_ratio:"9x16",
    script_style:"ThreeReasonsWriter", visual_style:"QuickTransitionTemplate",
    override_script, no_cta:false,
    caption_setting:{ style:"normal-black", offset:{x:0,y:0.38}, font_family:"Montserrat", font_size:66, font_style:"font-bold", max_width:900, line_height:1.15 }
  }, { headers: H, timeout: 60000 });

  const id = c.data?.id;
  if (!id) throw new Error("Creatify: no job id");

  const start = Date.now();
  while (Date.now() - start < 10 * 60 * 1000) {
    const { data } = await axios.get(`${BASE}/api/link_to_videos/${id}/`, { headers: H });
    if (["done","failed","error","cancelled"].includes(data.status)) {
      if (data.status !== "done") throw new Error(`Creatify failed: ${data.status}`);
      return { videoUrl: data.video_output as string, thumbnail: data.video_thumbnail as string };
    }
    await new Promise(r=>setTimeout(r, 6000));
  }
  throw new Error("Creatify: timeout");
}
