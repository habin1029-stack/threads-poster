import { NextRequest, NextResponse } from "next/server";

// Threads 토큰을 쿠키에서 가져옵니다.
export async function GET(req: NextRequest) {
  const token = req.cookies.get("threads_token")?.value;

  if (!token) {
    return NextResponse.json({
      connected: false,
      error: "Threads 계정에 연결되어 있지 않습니다."
    });
  }

  // 토큰을 사용하여 사용자 정보 가져오기
  try {
    const response = await fetch("https://graph.threads.net/v1.0/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return NextResponse.json({
        connected: false,
        error: "사용자 정보 가져오기 실패"
      });
    }

    const userData = await response.json();
    return NextResponse.json({
      connected: true,
      username: userData.username
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      error: "사용자 정보 가져오기 중 오류가 발생했습니다."
    });
  }
}