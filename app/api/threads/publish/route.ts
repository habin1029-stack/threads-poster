import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    const cookieStore = await cookies();
    const accessToken = 
      cookieStore.get("threads_access_token")?.value || 
      cookieStore.get("access_token")?.value || 
      cookieStore.get("token")?.value;

    const userId = 
      cookieStore.get("threads_user_id")?.value || 
      cookieStore.get("user_id")?.value;

    if (!accessToken || !userId) {
      return NextResponse.json(
        { error: "스레드 인증 정보가 없습니다. 로그인을 다시 진행해 주세요." },
        { status: 400 }
      );
    }

    // 1. 텍스트 컨테이너 생성
    const containerRes = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads`,
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
      throw new Error(containerData.error?.message || "텍스트 컨테이너 생성 실패");
    }
    const creationId = containerData.id;

    // 2. 최종 발행
    const publishRes = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads_publish`,
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
      throw new Error(publishData.error?.message || "스레드 최종 발행 실패");
    }

    return NextResponse.json({ success: true, id: publishData.id, permalink: publishData.permalink });

  } catch (error: any) {
    console.error("Threads Publish Error:", error);
    return NextResponse.json({ error: error.message || "발행 실패" }, { status: 500 });
  }
}