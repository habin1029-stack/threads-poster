import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    console.log("[Upload API] Starting file upload to Vercel Blob...", file.name);

    // 🌟 핵심 해결: addRandomSuffix: true 옵션을 추가하여 중복 파일명 충돌을 원천 차단합니다.
    const blob = await put(file.name, file, { 
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: true, 
    });

    console.log("[Upload API] Upload successful. URL:", blob.url);
    return NextResponse.json({ url: blob.url });
    
  } catch (error: any) {
    console.error("Detailed Upload Error:", error);
    return NextResponse.json({ error: error.message || "업로드 실패" }, { status: 500 });
  }
}