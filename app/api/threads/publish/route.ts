import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, imageUrl, accessToken, userId } = await req.json();

    if (!accessToken || !userId) {
      return NextResponse.json({ error: "인증 정보가 부족합니다. 스레드 로그인을 다시 해주세요." }, { status: 400 });
    }

    let creationId = "";

    if (imageUrl) {
      // 1단계: 이미지 미디어 컨테이너 생성
      const containerRes = await fetch(
        `https://graph.threads.net/v1.0/${userId}/threads`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            media_type: "IMAGE",
            image_url: imageUrl,
            text: text,
            access_token: accessToken,
          }),
        }
      );
      
      const containerData = await containerRes.json();
      if (!containerRes.ok) {
        throw new Error(containerData.error?.message || "이미지 컨테이너 생성 실패");
      }
      creationId = containerData.id;

    } else {
      // 텍스트 전용 컨테이너 생성
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
      creationId = containerData.id;
    }

    // 2단계: 생성된 컨테이너 최종 퍼블리시 (발행)
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

    return NextResponse.json({ success: true, id: publishData.id });

  } catch (error: any) {
    console.error("Threads Publish Error:", error);
    return NextResponse.json({ error: error.message || "발행 실패" }, { status: 500 });
  }
}