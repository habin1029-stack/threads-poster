import { NextRequest, NextResponse } from "next/server";

// imageUrl(사진 주소)을 추가로 받을 수 있도록 파라미터 업데이트
async function publishToThreads(token: string, content: string, imageUrl?: string) {
  try {
    // 1. 컨테이너 생성 (사진이 있으면 IMAGE 모드로, 없으면 TEXT 모드로 자동 변환)
    const requestBody: any = {
      access_token: token
    };

    if (imageUrl) {
      requestBody.media_type = "IMAGE";
      requestBody.image_url = imageUrl;
      requestBody.text = content; // 사진과 함께 들어갈 홍보 문구
    } else {
      requestBody.media_type = "TEXT";
      requestBody.text = content;
    }

    const containerResponse = await fetch("https://graph.threads.net/v1.0/me/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
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

    // ★ 핵심 수정 사항: 메타 서버가 '사진'을 처리할 시간을 넉넉히 줍니다 (5초 대기)
    console.log("[API] Waiting 5 seconds for Meta server processing...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 2. 컨테이너 발행
    const publishResponse = await fetch(`https://graph.threads.net/v1.0/me/threads_publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: token 
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

    // 화면(UI)에서 보내주는 사진 주소(imageUrl)도 함께 받도록 수정
    const { content, imageUrl } = await req.json();
    console.log("[API] Content to publish:", content);
    if (imageUrl) console.log("[API] Image URL to publish:", imageUrl);

    if (!content && !imageUrl) {
      console.error("[API] No content or image provided");
      return NextResponse.json({
        success: false,
        error: "게시할 내용이 없습니다."
      }, { status: 400 });
    }

    console.log("[API] Publishing to Threads with token...");
    const result = await publishToThreads(token, content, imageUrl);
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