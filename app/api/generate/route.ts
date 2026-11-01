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

    // Groq API 서버로 요청 전송 (OpenAI와 완벽하게 호환되는 구조)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GEMINI_API_KEY}` // 키 이름은 그대로 두고 Groq 키를 넣습니다.
      },
      body: JSON.stringify({
        model: "llama3-70b-8192", // Groq 무료 고성능 모델
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || "Groq 서버 통신 에러");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    const posts = content
      .split("|||")
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0);

    return NextResponse.json({ posts: posts });

  } catch (error: any) {
    console.error("Groq Error:", error);
    return NextResponse.json({ error: error.message || "게시글 생성 실패" }, { status: 500 });
  }
}