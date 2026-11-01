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
import { useState, useEffect, useRef } from "react";
import { ThreadsLoginButton } from "@/components/threads/ThreadsLoginButton";
import { ThreadsPostButton } from "@/components/threads/ThreadsPostButton";
import { PostHistory } from "@/components/threads/PostHistory";
import { toast } from "sonner";

// 실시간 타자(Typewriter) 효과 컴포넌트
function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    setDisplayedText("");
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(timer);
      }
    }, 30);

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
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  
  const [generatedPosts, setGeneratedPosts] = useState<string[]>([]);
  const [threadsConnected, setThreadsConnected] = useState(false);
  const [threadsUsername, setThreadsUsername] = useState<string | undefined>(undefined);
  const [postHistory, setPostHistory] = useState<any[]>([]);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lengths: Record<string, number> = {
    "짧게 (100자 이내)": 100,
    "보통 (200자 이내)": 200,
    "상세하게 (300자 이내)": 300,
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      alert("핵심 키워드를 입력해주세요.");
      return;
    }

    setIsGenerating(true);
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
      setIsGenerating(false);
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

  const handleThreadsLogin = () => {
    window.location.href = "/api/auth/threads";
  };

  const handleThreadsLogout = () => {
    setThreadsConnected(false);
    setThreadsUsername(undefined);
    toast.success("Threads 계정 연결이 해제되었습니다.");
  };

  const handlePostToThreads = async (content: string) => {
    if (!threadsConnected) {
      toast.error("Threads 계정에 연결되어 있지 않습니다. 먼저 계정을 연결해주세요.");
      return;
    }

    try {
      setIsPosting(true);
      let uploadedImageUrl = undefined;

      if (selectedImage) {
        toast.info("사진을 안전하게 업로드 중입니다...");
        const formData = new FormData();
        formData.append("file", selectedImage);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "사진 저장소 업로드 실패");
        }
        uploadedImageUrl = uploadData.url;
      }

      toast.info("스레드에 게시물을 등록하는 중입니다 (약 5초 소요)...");
      
      // 🌟 핵심 수정: 백엔드가 요구하는 필드명인 'text'로 content를 전달하도록 수정
      const response = await fetch("/api/threads/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          text: content, 
          imageUrl: uploadedImageUrl 
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Threads 게시 실패");
      }

      setPostHistory([
        ...postHistory,
        {
          id: responseData.postId || responseData.id,
          content,
          date: new Date().toLocaleString(),
          status: "success",
          permalink: responseData.permalink,
        },
      ]);
      toast.success(`게시물이 성공적으로 Threads에 게시되었습니다!`);
    } catch (error: any) {
      toast.error(`게시 실패: ${error.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  useEffect(() => {
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

  const isBusy = isGenerating || isPosting;

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
              onChange={(e) => setKeyword(e.target.value)}
              disabled={isBusy}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-threads-muted text-sm mb-1">지역</label>
              <Select value={region} onValueChange={setRegion} disabled={isBusy}>
                <SelectItem value="강변">강변 테크노마트</SelectItem>
                <SelectItem value="영등포">영등포 전자상가</SelectItem>
                <SelectItem value="구로">구로 디지털단지</SelectItem>
                <SelectItem value="명동">명동/시청</SelectItem>
              </Select>
            </div>
            <div>
              <label className="block text-threads-muted text-sm mb-1">스타일</label>
              <Select value={style} onValueChange={(val) => setStyle(val as any)} disabled={isBusy}>
                <SelectItem value="일상 대화형">일상 대화형</SelectItem>
                <SelectItem value="가볍게 추천형">가볍게 추천형</SelectItem>
                <SelectItem value="친구에게 알려주는 말투">친구에게 알려주는 말투</SelectItem>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-threads-muted text-sm mb-1">게시글 개수</label>
              <Select value={count.toString()} onValueChange={(val) => setCount(parseInt(val))} disabled={isBusy}>
                <SelectItem value="3">3개</SelectItem>
                <SelectItem value="5">5개</SelectItem>
                <SelectItem value="10">10개</SelectItem>
              </Select>
            </div>
            <div>
              <label className="block text-threads-muted text-sm mb-1">글 길이</label>
              <Select value={length} onValueChange={setLength} disabled={isBusy}>
                <SelectItem value="짧게 (100자 이내)">짧게 (100자 이내)</SelectItem>
                <SelectItem value="보통 (200자 이내)">보통 (200자 이내)</SelectItem>
                <SelectItem value="상세하게 (300자 이내)">상세하게 (300자 이내)</SelectItem>
              </Select>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-lg bg-threads-surface border border-threads-border">
            <label className="block text-sm font-medium mb-2">
              스레드에 함께 올릴 사진 (선택)
            </label>
            {imagePreview ? (
              <div className="relative inline-block mt-2">
                <img src={imagePreview} alt="미리보기" className="h-40 w-auto rounded-md object-cover border border-threads-border" />
                <button
                  onClick={clearImage}
                  className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-lg hover:bg-red-600"
                  disabled={isBusy}
                >
                  ✕
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-dashed border-2 py-8 text-threads-muted hover:text-threads-text"
                disabled={isBusy}
              >
                📷 스마트폰 갤러리에서 사진 선택
              </Button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <Button
            type="button"
            size="lg"
            disabled={isBusy}
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>열심히 처리 중입니다... ✍️</span>
              </>
            ) : (
              "AI 게시글 생성"
            )}
          </Button>
        </Card>

        {isGenerating && (
          <Card className="p-6 mt-6">
            <h3 className="font-semibold mb-4 text-threads-muted animate-pulse">스레드 감성으로 작성하고 있어요...</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded border border-threads-border bg-threads-surface animate-pulse">
                  <div className="h-4 bg-threads-border rounded w-3/4 mb-3 opacity-50"></div>
                  <div className="h-4 bg-threads-border rounded w-full mb-3 opacity-50"></div>
                  <div className="h-4 bg-threads-border rounded w-5/6 mb-4 opacity-50"></div>
                  <div className="flex gap-2">
                    <div className="h-8 w-16 bg-threads-border rounded opacity-50"></div>
                    <div className="h-8 w-24 bg-threads-border rounded opacity-50"></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {!isGenerating && generatedPosts.length > 0 && (
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
                      disabled={isPosting}
                    >
                      복사
                    </Button>
                    <ThreadsPostButton
                      content={post}
                      onPost={() => handlePostToThreads(post)}
                      isLoading={isPosting} 
                    />
                  </div>
                </div>
              ))}
            </div>

            <PostHistory posts={postHistory} onPostUpdated={handlePostUpdate} />
          </Card>
        )}
      </div>
    </main>
  );
}