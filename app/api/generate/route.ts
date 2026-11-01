import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// 정확한 Flash 모델명으로 설정
const GEMINI_MODEL = "gemini-2.5-flash";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyword, region, store, style, length, count } = body;

    // Vercel에 등록한 환경변수 이름과 정확히 일치해야 함
    const apiKey = process.env.GEMINI_API_KEY; 
    if (!apiKey) {
      return NextResponse.json({ error: "API 키가 없습니다." }, { status: 500 });
    }

    // 최신 공식 @google/genai SDK 초기화
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `당신은 한국의 Threads 사용자입니다.
- 일상 대화처럼 자연스러운 문체로 작성합니다.
- 휴대폰 구매에 관심을 자연스럽게 유도합니다.
- 광고 느낌을 빼고 친구에게 말하듯 하세요.
- 키워드: ${keyword}, 지역: ${region}, 매장: ${store || "미지정"}
- 스타일: ${style}, 글 길이: ${length}자 이내
- ${count}개의 서로 다른 게시글을 생성하고, 게시글 사이에 '---' 구분자를 넣어주세요.`;

    // 최신 SDK 방식인 ai.models.generateContent 사용
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const text = response.text;
    if (!text) {
      throw new Error("AI로부터 응답을 받지 못했습니다.");
    }

    const posts = text.split("---").map(p => p.trim()).filter(p => p.length > 0);

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || "알 수 없는 오류가 발생했습니다." }, { status: 500 });
  }
}