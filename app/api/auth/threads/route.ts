import { NextRequest, NextResponse } from "next/server";

const THREADS_CLIENT_ID = process.env.THREADS_APP_ID;
const THREADS_REDIRECT_URI = process.env.THREADS_REDIRECT_URI;

export async function GET(req: NextRequest) {
  if (!THREADS_CLIENT_ID || !THREADS_REDIRECT_URI) {
    return NextResponse.json(
      { success: false, error: "Threads OAuth 설정이 누락되었습니다." },
      { status: 500 }
    );
  }

  // Threads 공식 OAuth 로그인 URL
  const scope = "threads_basic,threads_content_publish";
  const authUrl = `https://threads.net/oauth/authorize?client_id=${THREADS_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    THREADS_REDIRECT_URI
  )}&scope=${scope}&response_type=code`;

  return NextResponse.redirect(authUrl);
}
