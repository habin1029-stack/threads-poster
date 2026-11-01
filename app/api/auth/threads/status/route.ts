import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("threads_access_token")?.value;
    const userId = cookieStore.get("threads_user_id")?.value;

    if (!accessToken || !userId) {
      return NextResponse.json({ connected: false });
    }

    // 유저 프로필 정보 가져오기 (이름 확인용)
    const profileRes = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${accessToken}`
    );
    const profileData = await profileRes.json();

    return NextResponse.json({
      connected: true,
      username: profileData.username || "스레드 사용자",
    });
  } catch (error) {
    return NextResponse.json({ connected: false });
  }
}