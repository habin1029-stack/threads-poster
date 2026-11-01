import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, imageUrl } = body;

    // 1. 요청 Body나 쿠키 어디에 있든 인증 정보를 강력하게 찾아냅니다.
    const cookieStore = await cookies();
    const accessToken = 
      body.accessToken || 
      cookieStore.get("threads_access_token")?.value || 
      cookieStore.get("access_token")?.value || 
      cookieStore.get("token")?.value;

    const userId = 
      body.userId || 
      cookieStore.get("threads_user_id")?.value || 
      cookieStore.get("user_id")?.value;

    console.log("[Publish API] Token exists:", !!accessToken, "UserId:", userId);

    if (!accessToken || !userId) {
      return NextResponse.json(
        { error: "스레드 인증 정보가 없습니다. 스레드 로그인을 다시 진행해 주세요." },
        { status: 400 }
      );
    }

    let creationId = "";

    if (imageUrl) {
      console.log("[Publish API] Creating IMAGE container with URL:", imageUrl);
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
        console.error("Meta Container Error:", containerData);
        throw new Error(containerData.error?.message || "이미지 컨테이너 생성 실패");
      }
      creationId = containerData.id;
    } else {
      console.log("[Publish API] Creating TEXT container");
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
        console.error("Meta Container Error:", containerData);
        throw new Error(containerData.error?.message || "텍스트 컨테이너 생성 실패");
      }
      creationId = containerData.id;
    }

    console.log("[Publish API] Publishing container ID:", creationId);
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
      console.error("Meta Publish Error:", publishData);
      throw new Error(publishData.error?.message || "스레드 최종 발행 실패");
    }

    console.log("[Publish API] Success:", publishData);
    return NextResponse.json({ success: true, id: publishData.id, permalink: publishData.permalink });

  } catch (error: any) {
    console.error("Threads Publish Error:", error);
    return NextResponse.json({ error: error.message || "발행 실패" }, { status: 500 });
  }
}