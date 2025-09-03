import type { Handler } from "@netlify/functions";
import { getJson } from "../utils/store";

export const handler: Handler = async () => {
  const ytA = await getJson("ytA_channel", null);
  const ytB = await getJson("ytB_channel", null);
  
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      channelA: ytA ? {
        title: ytA.title,
        id: ytA.id,
        subscriberCount: ytA.subscriberCount,
        videoCount: ytA.videoCount,
        authorized: true
      } : { authorized: false },
      channelB: ytB ? {
        title: ytB.title,
        id: ytB.id,
        subscriberCount: ytB.subscriberCount,
        videoCount: ytB.videoCount,
        authorized: true
      } : { authorized: false }
    })
  };
};