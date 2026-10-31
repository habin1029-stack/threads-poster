import { NextRequest, NextResponse } from "next/server";

async function publishToThreads(token: string, content: string) {
  try {
    // 1. 컨테이너 생성 (Threads API는 컨테이너 생성 후 게시하는 2단계 방식을 사용합니다)
    const containerResponse = await fetch("https://graph.threads.net/v1.0/me/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        media_type: "TEXT",
        text: content,
        access_token: token // Meta API는 보통 body나 query 파라미터로 토큰을 받습니다.
      })
    });

    if (!containerResponse.ok) {
      const errorData = await containerResponse.json().catch(() => ({}));
      console.error("Container Error Details:", errorData);
      const errorMessage = errorData.error?.message || "Threads 미디어 컨테이너 생성 실패";
      throw new Error(errorMessage);
    }

    const containerData = await containerResponse.json();
    const creationId = containerData.id;
    console.log(`[API] Container created successfully. ID: ${creationId}`);

    // ★ 핵심 수정 사항: 메타 서버가 컨테이너를 처리할 시간을 줍니다 (3초 대기)
    console.log("[API] Waiting 3 seconds for Meta server processing...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 2. 컨테이너 발행
    const publishResponse = await fetch(`https://graph.threads.net/v1.0/me/threads_publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: token // 여기에도 토큰 추가
      })
    });

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json().catch(() => ({}));
      console.error("Publish Error Details:", errorData);
      const errorMessage = errorData.error?.message || "Threads 게시물 발행 실패";
      throw new Error(errorMessage);
    }

    return publishResponse.json();
  } catch (error: any) {
    console.error("Publish Error:", error);
    throw new Error(`게시 실패: ${error.message}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("[API] Starting Threads publish request...");
    const token = req.cookies.get("threads_token")?.value;
    console.log("[API] Token available:", !!token);

    if (!token) {
      console.error("[API] No token found in cookies");
      return NextResponse.json({
        success: false,
        error: "Threads 계정에 연결되어 있지 않습니다. 먼저 계정을 연결해주세요."
      }, { status: 401 });
    }

    const { content } = await req.json();
    console.log("[API] Content to publish:", content);

    if (!content) {
      console.error("[API] No content provided");
      return NextResponse.json({
        success: false,
        error: "게시할 내용이 없습니다."
      }, { status: 400 });
    }

    console.log("[API] Publishing to Threads with token...");
    const result = await publishToThreads(token, content);
    console.log("[API] Publish successful. Result:", result);
    
    return NextResponse.json({
      success: true,
      postId: result.id,
      permalink: `https://www.threads.net/t/${result.id}`
    });
  } catch (error: any) {
    console.error("[API] Threads Publish Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "알 수 없는 오류가 발생했습니다."
    }, { status: 500 });
  }
}