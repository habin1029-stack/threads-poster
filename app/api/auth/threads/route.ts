import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.THREADS_CLIENT_ID;
  const redirectUri = process.env.THREADS_REDIRECT_URI; // 예: https://your-domain.vercel.app/api/auth/threads/callback

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Threads API 설정이 누락되었습니다." }, { status: 500 });
  }

  const scope = "threads_basic,threads_content_publish";
  const authUrl = `https://threads.net/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scope}&response_type=code`;

  return NextResponse.redirect(authUrl);
}