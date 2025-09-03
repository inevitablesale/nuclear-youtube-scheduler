import type { Handler } from "@netlify/functions";
import { ensureMigrations, getRefreshToken, sql } from "../utils/db";

export const handler: Handler = async () => {
  await ensureMigrations();
  
  try {
    const tokenA = await getRefreshToken("A");
    const tokenB = await getRefreshToken("B");
    
    // Also check if we have channel data
    const channels = await sql`select * from channels`;
    
    const A = !!tokenA;
    const B = !!tokenB;
    
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        ok: true, 
        authorized: { A, B },
        debug: {
          tokenAExists: !!tokenA,
          tokenBExists: !!tokenB,
          tokenALength: tokenA?.length || 0,
          tokenBLength: tokenB?.length || 0,
          channelsInDb: channels.length,
          channels: channels
        }
      }) 
    };
  } catch (error: any) {
    return {
      statusCode: 200, // Keep UI happy
      body: JSON.stringify({
        ok: false,
        authorized: { A: false, B: false },
        error: error.message
      })
    };
  }
};