import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", req.url));
  }

  try {
    // 🌟 Threads 앱 ID 직접 적용
    const clientId = "983259668161377";
    const clientSecret = process.env.THREADS_CLIENT_SECRET || "0a778672547b40a0e854cd0543ab0af3"; // 혹은 시크릿 문자열 직접 입력
    const redirectUri = `${url.origin}/api/auth/threads/callback`;

    // 1. Authorization Code로 Access Token 교환
    const tokenRes = await fetch("https://graph.threads.net/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_message || "액세스 토큰 발급 실패");
    }

    const accessToken = tokenData.access_token;
    const userId = tokenData.user_id;

    // 2. 쿠키에 토큰과 유저 ID 저장
    const cookieStore = await cookies();
    cookieStore.set({
      name: "threads_access_token",
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    cookieStore.set({
      name: "threads_user_id",
      value: String(userId),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.redirect(new URL("/", req.url));
  } catch (error: any) {
    console.error("Threads Login Callback Error:", error);
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, req.url));
  }
}