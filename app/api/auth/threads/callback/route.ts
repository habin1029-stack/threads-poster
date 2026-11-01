import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", req.url));
  }

  try {
    const clientId = process.env.THREADS_CLIENT_ID;
    const clientSecret = process.env.THREADS_CLIENT_SECRET;
    const redirectUri = process.env.THREADS_REDIRECT_URI;

    // 1. Authorization Code로 Access Token 교환
    const tokenRes = await fetch("https://graph.threads.net/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        grant_type: "authorization_code",
        redirect_uri: redirectUri!,
        code: code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_message || "액세스 토큰 발급 실패");
    }

    const accessToken = tokenData.access_token;
    const userId = tokenData.user_id;

    // 2. 롱라이브(Long-lived) 토큰으로 교환 (선택 사항이지만 권장)
    const longTokenRes = await fetch(
      `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${clientSecret}&access_token=${accessToken}`
    );
    const longTokenData = await longTokenRes.json();
    const finalAccessToken = longTokenData.access_token || accessToken;

    // 3. 🌟 쿠키에 토큰과 유저 ID를 확실하게 저장 (7일간 유지)
    const cookieStore = await cookies();
    cookieStore.set({
      name: "threads_access_token",
      value: finalAccessToken,
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

    // 로그인 성공 후 메인 페이지로 리다이렉트
    return NextResponse.redirect(new URL("/", req.url));
  } catch (error: any) {
    console.error("Threads Login Callback Error:", error);
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, req.url));
  }
}