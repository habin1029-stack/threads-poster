import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, accessToken: bodyToken } = body;

    const cookieStore = await cookies();
    const accessToken = 
      bodyToken || 
      cookieStore.get("threads_access_token")?.value || 
      cookieStore.get("access_token")?.value || 
      cookieStore.get("token")?.value;

    console.log("=== 스레드 발행 요청 디버깅 ===");
    console.log("Access Token 존재 여부:", !!accessToken);

    if (!accessToken) {
      return NextResponse.json(
        { error: "스레드 인증 정보가 없습니다. 로그인을 다시 진행해 주세요." },
        { status: 400 }
      );
    }

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "게시할 텍스트 내용이 없습니다." },
        { status: 400 }
      );
    }

    // 1. 텍스트 컨테이너 생성 (userId 대신 'me' 사용)
    const containerRes = await fetch(
      `https://graph.threads.net/v1.0/me/threads`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "TEXT",
          text: text,
          access_token: accessToken,
        }),
      }
    );
    
    const containerData = await containerRes.json();
    if (!containerRes.ok) {
      console.error("Container Creation Error:", containerData);
      throw new Error(containerData.error?.message || "텍스트 컨테이너 생성 실패");
    }
    const creationId = containerData.id;

    // 2. 최종 발행 (userId 대신 'me' 사용)
    const publishRes = await fetch(
      `https://graph.threads.net/v1.0/me/threads_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishRes.json();
    if (!publishRes.ok) {
      console.error("Threads Publish Error:", publishData);
      throw new Error(publishData.error?.message || "스레드 최종 발행 실패");
    }

    return NextResponse.json({ 
      success: true, 
      id: publishData.id, 
      permalink: publishData.permalink 
    });

  } catch (error: any) {
    console.error("Threads Publish Catch Error:", error);
    return NextResponse.json({ error: error.message || "발행 실패" }, { status: 500 });
  }
}