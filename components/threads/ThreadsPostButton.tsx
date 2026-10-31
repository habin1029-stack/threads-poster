"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";

interface ThreadsPostButtonProps {
  content: string;
  onPost: () => Promise<void>;
  isLoading: boolean;
}

export function ThreadsPostButton({
  content,
  onPost,
  isLoading,
}: ThreadsPostButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);

  const handlePost = async () => {
    console.log("ThreadsPostButton: Attempting to post content:", content);
    if (!content.trim()) {
      toast.error("게시할 내용이 없습니다.");
      return;
    }

    setInternalLoading(true);
    try {
      console.log("ThreadsPostButton: Calling onPost function...");
      await onPost();
      toast.success("게시물 발행 성공! Threads에 게시되었습니다.");
    } catch (error: any) {
      console.error("ThreadsPostButton: Error posting:", error);
      toast.error("게시물 발행 실패: " + (error.message || "알 수 없는 오류가 발생했습니다."));
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePost}
      disabled={isLoading || internalLoading || !content.trim()}
      className="mt-4"
    >
      {internalLoading ? "게시 중..." : "Threads에 게시하기"}
    </Button>
  );
}