import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // 1. URL에서 메타가 전달해 준 인가 코드(code) 추출
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // 사용자가 승인을 취소했거나 에러가 난 경우 메인 페이지로 돌려보냄
  if (error) {
    console.error("OAuth Error:", error);
    return NextResponse.redirect(new URL("/?error=oauth_failed", req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", req.url));
  }

  try {
    // 2. 받은 인가 코드(code)를 사용해 실제 게시 권한이 있는 Access Token으로 교환
    const tokenResponse = await fetch("https://graph.threads.net/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.THREADS_APP_ID || "",
        client_secret: process.env.THREADS_APP_SECRET || "",
        grant_type: "authorization_code",
        redirect_uri: process.env.THREADS_REDIRECT_URI || "",
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token Exchange Error:", tokenData);
      throw new Error("액세스 토큰 발급 실패");
    }

    const accessToken = tokenData.access_token;
    console.log("토큰 발급 성공:", accessToken.substring(0, 10) + "...");

    // 3. 발급받은 토큰을 브라우저 쿠키(threads_token)에 안전하게 저장하고 메인 화면으로 이동
    const response = NextResponse.redirect(new URL("/", req.url)); 
    response.cookies.set("threads_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30일 유지
    });

    return response;

  } catch (error: any) {
    console.error("Callback Route Error:", error);
    return NextResponse.redirect(new URL("/?error=token_exchange_failed", req.url));
  }
}