"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { ThreadsLoginButton } from "@/components/threads/ThreadsLoginButton";
import { ThreadsPostButton } from "@/components/threads/ThreadsPostButton";
import { PostHistory } from "@/components/threads/PostHistory";
import { toast } from "sonner";

// 실시간 타자(Typewriter) 효과를 위한 컴포넌트
function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    setDisplayedText(""); // 텍스트 초기화
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(timer);
      }
    }, 30); // 타자 속도 조절

    return () => clearInterval(timer);
  }, [text]);

  return <p className="whitespace-pre-wrap text-threads-text">{displayedText}</p>;
}

export default function HomePage() {
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("강변");
  const [style, setStyle] = useState<"일상 대화형" | "가볍게 추천형" | "친구에게 알려주는 말투">(
    "일상 대화형"
  );
  const [count, setCount] = useState(3);
  const [length, setLength] = useState("짧게 (100자 이내)");
  const [loading, setLoading] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<string[]>([]);
  const [threadsConnected, setThreadsConnected] = useState(false);
  const [threadsUsername, setThreadsUsername] = useState<string | undefined>(undefined);
  const [postHistory, setPostHistory] = useState<any[]>([]);
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);

  const lengths: Record<string, number> = {
    "짧게 (100자 이내)": 100,
    "보통 (200자 이내)": 200,
    "상세하게 (300자 이내)": 300,
  };

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      alert("핵심 키워드를 입력해주세요.");
      return;
    }

    setLoading(true);
    setGeneratedPosts([]);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword: keyword.trim(),
          region: region.trim(),
          style: style,
          length: lengths[length],
          count: count,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "게시글 생성에 실패했습니다.");
      }

      const data = await response.json();
      setGeneratedPosts(data.posts || []);
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "게시글 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePostSelection = (index: number) => {
    setSelectedPostIndex(index);
  };

  const handleThreadsLogin = () => {
    console.log("Starting Threads OAuth login...");
    window.location.href = "/api/auth/threads";
  };

  const handleThreadsLogout = () => {
    setThreadsConnected(false);
    setThreadsUsername(undefined);
    toast.success("Threads 계정 연결이 해제되었습니다.");
    console.log("Threads logout initiated.");
  };

  const handlePostToThreads = async (content: string) => {
    console.log('[UI] handlePostToThreads: Starting post process for content:', content);
    if (!threadsConnected) {
      toast.error("Threads 계정에 연결되어 있지 않습니다. 먼저 계정을 연결해주세요.");
      console.error('[UI] User not connected to Threads');
      return;
    }

    try {
      console.log('[UI] handlePostToThreads: Attempting to post to Threads with content:', content);
      setLoading(true);
      const response = await fetch("/api/threads/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      const responseData = await response.json();
      console.log('[UI] handlePostToThreads: API Response:', responseData);

      if (!response.ok) {
        const errorMessage = responseData.error || "Threads 게시 실패";
        console.error('[UI] handlePostToThreads: API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      setPostHistory([
        ...postHistory,
        {
          id: responseData.postId,
          content,
          date: new Date().toLocaleString(),
          status: "success",
          permalink: responseData.permalink,
        },
      ]);
      toast.success(`게시물 "${content.substring(0, 20)}..."이 성공적으로 Threads에 게시되었습니다.`);
    } catch (error: any) {
      console.error('[UI] handlePostToThreads: Error posting to Threads:', error);
      setPostHistory([
        ...postHistory,
        {
          id: Date.now().toString(),
          content,
          date: new Date().toLocaleString(),
          status: "failed",
          error: error.message,
        },
      ]);
      toast.error(`게시 실패: ${error.message || "알 수 없는 오류가 발생했습니다."}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = (updatedPost: any) => {
    setPostHistory(
      postHistory.map((post) =>
        post.id === updatedPost.id ? updatedPost : post
      )
    );
    toast.success("게시물이 업데이트되었습니다.");
  };

  useEffect(() => {
    // Threads 계정 연결 상태 확인
    const checkThreadsConnection = async () => {
      try {
        const response = await fetch("/api/auth/threads/status");
        if (response.ok) {
          const data = await response.json();
          setThreadsConnected(data.connected);
          setThreadsUsername(data.username);
        }
      } catch (error) {
        console.error("Threads 연결 상태 확인 실패:", error);
      }
    };

    checkThreadsConnection();
  }, []);

  return (
    <main className="min-h-screen p-4 md:p-6 bg-threads-bg text-threads-text">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            스레드 생성기
          </h1>
          <p className="text-threads-muted text-sm">
            자연스러운 일상 대화 형식의 휴대폰 홍보 게시글을 생성합니다.
          </p>
        </header>

        <ThreadsLoginButton
          onLogin={handleThreadsLogin}
          isConnected={threadsConnected}
          username={threadsUsername}
          onLogout={handleThreadsLogout}
        />

        <Card className="p-6 mb-6">
          <h3 className="font-semibold mb-4">게시글 설정</h3>

          <div className="mb-4">
            <label className="block text-threads-muted text-sm mb-1">
              핵심 키워드
            </label>
            <Input
              placeholder="예: 휴대폰 성지, 가격, 강변 쪽"
              value={keyword}
              onValueChange={setKeyword}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-threads-muted text-sm mb-1">
                지역
              </label>
              <Select
                value={region}
                onValueChange={(val) => setRegion(val)}
                disabled={loading}
              >
                <SelectItem value="강변">강변 테크노마트</SelectItem>
                <SelectItem value="영등포">영등포 전자상가</SelectItem>
                <SelectItem value="구로">구로 디지털단지</SelectItem>
                <SelectItem value="명동">명동/시청</SelectItem>
              </Select>
            </div>

            <div>
              <label className="block text-threads-muted text-sm mb-1">
                스타일
              </label>
              <Select
                value={style}
                onValueChange={(val) => setStyle(val as any)}
                disabled={loading}
              >
                <SelectItem value="일상 대화형">일상 대화형</SelectItem>
                <SelectItem value="가볍게 추천형">가볍게 추천형</SelectItem>
                <SelectItem value="친구에게 알려주는 말투">친구에게 알려주는 말투</SelectItem>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-threads-muted text-sm mb-1">
                게시글 개수
              </label>
              <Select
                value={count.toString()}
                onValueChange={(val) => setCount(parseInt(val))}
                disabled={loading}
              >
                <SelectItem value="3">3개</SelectItem>
                <SelectItem value="5">5개</SelectItem>
                <SelectItem value="10">10개</SelectItem>
              </Select>
            </div>

            <div>
              <label className="block text-threads-muted text-sm mb-1">
                글 길이
              </label>
              <Select
                value={length}
                onValueChange={(val) => setLength(val)}
                disabled={loading}
              >
                <SelectItem value="짧게 (100자 이내)">짧게 (100자 이내)</SelectItem>
                <SelectItem value="보통 (200자 이내)">보통 (200자 이내)</SelectItem>
                <SelectItem value="상세하게 (300자 이내)">상세하게 (300자 이내)</SelectItem>
              </Select>
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            disabled={loading}
            onClick={handleGenerate}
            className="w-full"
          >
            {loading ? "생성 중..." : "AI 게시글 생성"}
          </Button>
        </Card>

        {generatedPosts.length > 0 && (
          <Card className="p-6 mt-6">
            <h3 className="font-semibold mb-4">생성된 게시글 ({generatedPosts.length}개)</h3>
            <div className="space-y-4">
              {generatedPosts.map((post, index) => (
                <div key={index} className="p-4 rounded border border-threads-border bg-threads-surface">
                  <TypewriterText text={post} />
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(post);
                        alert("복사되었습니다!");
                      }}
                    >
                      복사
                    </Button>
                    <ThreadsPostButton
                      content={post}
                      onPost={() => handlePostToThreads(post)}
                      isLoading={loading}
                    />
                  </div>
                </div>
              ))}
            </div>

            <PostHistory posts={postHistory} onPostUpdated={handlePostUpdate} />

            <div className="mt-4 pt-4 border-t border-threads-border">
              <Button
                type="button"
                onClick={() => {
                  const text = generatedPosts.join("\n\n");
                  navigator.clipboard.writeText(text);
                  alert("전체 게시글이 복사되었습니다!");
                }}
                className="w-full"
              >
                전체 복사
              </Button>
            </div>
          </Card>
        )}

        <div className="mt-8 p-4 rounded border border-threads-border text-threads-muted text-sm text-center">
          <p>
            "강변", "휴대폰 가격" 같은 키워드를 입력하면 자연스러운 게시글이
            생성됩니다.
          </p>
        </div>
      </div>
    </main>
  );
}