import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { keyword, region, style, length, count } = body;

    const prompt = `당신은 휴대폰 판매점의 전문 마케터입니다.
    다음 조건에 맞춰 스레드(Threads)에 올릴 홍보 게시글을 ${count}개 작성해주세요.

    조건:
    - 핵심 키워드: ${keyword}
    - 지역: ${region}
    - 스타일: ${style}
    - 길이: 각 게시글당 ${length}자 이내
    - 매장 이름은 절대 넣지 마세요.
    - 자연스럽고 트렌디하게 작성해주세요.

    답변은 반드시 게시글 내용만 출력하고, 각 게시글 사이에는 "|||" 기호를 넣어서 구분해주세요.`;

    // Vercel에 쉼표(,)로 연결해서 등록한 여러 API 키를 배열로 쪼갭니다.
    const apiKeys = (process.env.GEMINI_API_KEY || "").split(",").map(k => k.trim());

    if (apiKeys.length === 0 || apiKeys[0] === "") {
      return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
    }

    let content = "";
    let success = false;
    let lastError = "";

    // API 키를 1번부터 순서대로 시도합니다.
    for (const key of apiKeys) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        content = data.candidates[0].content.parts[0].text;
        success = true;
        break; // 성공하면 다음 키로 넘어가지 않고 즉시 종료!
      } else {
        // 429(용량 초과) 에러가 나면 다음 순서의 키로 넘어갑니다.
        const errorData = await response.json().catch(() => ({}));
        lastError = errorData.error?.message || "알 수 없는 에러";
        continue; 
      }
    }

    // 모든 키를 다 썼는데도 실패했을 경우
    if (!success) {
      throw new Error(`등록된 모든 API 키의 무료 사용량이 초과되었습니다.`);
    }

    const posts = content
      .split("|||")
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0);

    return NextResponse.json({ posts: posts });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "게시글 생성 실패" }, { status: 500 });
  }
}