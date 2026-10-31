import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";

// Threads OAuth 설정
const THREADS_CLIENT_ID = process.env.THREADS_APP_ID;
const THREADS_CLIENT_SECRET = process.env.THREADS_APP_SECRET;
const THREADS_REDIRECT_URI = process.env.THREADS_REDIRECT_URI;

// OAuth 클라이언트 생성
const oauth2Client = new OAuth2Client(
  THREADS_CLIENT_ID,
  THREADS_CLIENT_SECRET,
  THREADS_REDIRECT_URI
);

// Threads 인증 URL 생성
const getThreadsAuthUrl = () => {
  const scopes = [
    "threads_basic",
    "threads_content_publish"
  ];
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
    state: "random_state_string", // 추가적인 보안 추가
  });
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  if (error) {
    return NextResponse.redirect(
      new URL("/", req.url).toString() +
        "?error=" +
        encodeURIComponent(error)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/", req.url).toString() +
        "?error=missing_code_or_state"
    );
  }

  try {
    // 인증 코드로 토큰 교환
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 사용자 정보 가져오기
    const response = await fetch("https://graph.threads.net/v1.0/me", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error("사용자 정보 가져오기 실패: " + response.statusText);
    }

    const userData = await response.json();

    // 사용자 정보로 리디렉션
    const responseWithCookie = NextResponse.redirect(
      new URL("/", req.url).toString() +
        "?connected=true&username=" +
        encodeURIComponent(userData.username)
    );

    responseWithCookie.cookies.set(
      "threads_token",
      tokens.access_token!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7일
        path: "/",
      }
    );

    return responseWithCookie;
  } catch (error: any) {
    console.error("Threads 인증 오류:", error);
    return NextResponse.redirect(
      new URL("/", req.url).toString() +
        "?error=" +
        encodeURIComponent(error.message || "authentication_failed")
    );
  }
}