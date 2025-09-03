import type { Handler } from "@netlify/functions";
import { ensureMigrations, getRefreshToken, sql } from "../utils/db";

export const handler: Handler = async () => {
  await ensureMigrations();
  
  try {
    // Check what's in the oauth_tokens table
    const tokens = await sql`select * from oauth_tokens`;
    
    // Check what's in the channels table
    const channels = await sql`select * from channels`;
    
    // Test getting refresh tokens
    const tokenA = await getRefreshToken("A");
    const tokenB = await getRefreshToken("B");
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        oauth_tokens: tokens,
        channels: channels,
        refreshTokenA: tokenA ? "EXISTS" : "MISSING",
        refreshTokenB: tokenB ? "EXISTS" : "MISSING",
        tokenALength: tokenA?.length || 0,
        tokenBLength: tokenB?.length || 0
      })
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      })
    };
  }
};