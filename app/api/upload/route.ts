import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    // Vercel Blob에 사진을 안전하게 업로드하고 인터넷 주소를 발급받습니다.
    const blob = await put(file.name, file, { access: 'public' });

    return NextResponse.json({ url: blob.url });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message || "업로드 실패" }, { status: 500 });
  }
}