import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { text, imageUrl } = await req.json();

    // 쿠키에서 스레드 인증 정보 안전하게 추출
    const cookieStore = cookies();
    const accessToken = cookieStore.get("threads_access_token")?.value;
    const userId = cookieStore.get("threads_user_id")?.value;

    console.log("[Publish API] Token exists:", !!accessToken, "UserId:", userId);

    if (!accessToken || !userId) {
      return NextResponse.json(
        { error: "스레드 인증 정보가 만료되었거나 없습니다. 다시 로그인해 주세요." },
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
    return NextResponse.json({ success: true, id: publishData.id });

  } catch (error: any) {
    console.error("Threads Publish Error:", error);
    return NextResponse.json({ error: error.message || "발행 실패" }, { status: 500 });
  }
}