import { neon } from "@netlify/neon";

if (!process.env.NETLIFY_DATABASE_URL) throw new Error("NETLIFY_DATABASE_URL missing");
export const sql = neon(process.env.NETLIFY_DATABASE_URL);

export async function ensureMigrations() {
  await sql`create table if not exists oauth_tokens (
    channel_label text primary key,
    refresh_token text not null,
    updated_at timestamptz default now()
  )`;
  
  // channels table for YouTube channel metadata
  await sql`create table if not exists channels (
    label text primary key,
    youtube_channel_id text,
    title text,
    handle text,
    country text,
    created_at timestamptz default now()
  )`;
  
  // analytics daily rollup table
  await sql`create table if not exists analytics_daily (
    channel_label text not null references channels(label) on delete cascade,
    video_id text,
    date date not null,
    views bigint,
    likes bigint,
    comments bigint,
    shares bigint,
    subs_gained bigint,
    subs_lost bigint,
    watch_time_seconds bigint,
    primary key (channel_label, date, video_id)
  )`;
}

export async function setRefreshToken(channel: "A"|"B", token: string) {
  await sql`insert into oauth_tokens (channel_label, refresh_token)
    values (${channel}, ${token})
    on conflict (channel_label) do update set refresh_token=excluded.refresh_token, updated_at=now()`;
}

export async function getRefreshToken(channel: "A"|"B") {
  const rows = await sql`select refresh_token from oauth_tokens where channel_label=${channel}`;
  return rows[0]?.refresh_token as string | undefined;
}