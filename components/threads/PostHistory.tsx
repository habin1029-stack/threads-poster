import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface PostHistoryItem {
  id: string;
  content: string;
  date: string;
  status: "success" | "failed";
  permalink?: string;
}

interface PostHistoryProps {
  posts: PostHistoryItem[];
  onPostUpdated: (updatedPost: PostHistoryItem) => void;
}

export function PostHistory({ posts, onPostUpdated }: PostHistoryProps) {
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>("");

  const handleEdit = (postId: string) => {
    const post = posts.find((post) => post.id === postId);
    if (post) {
      setEditingPostId(postId);
      setEditedContent(post.content);
    }
  };

  const handleSave = () => {
    if (editingPostId) {
      const originalPost = posts.find((post) => post.id === editingPostId);
      if (!originalPost) return; // 타입 에러 방지를 위한 안전 장치

      const updatedPost: PostHistoryItem = {
        ...originalPost,
        content: editedContent
      };
      onPostUpdated(updatedPost);
      setEditingPostId(null);
      setEditedContent("");
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>게시 이력</CardTitle>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <p>아직 게시한 게시물이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="font-medium text-sm">
                    {post.date} - {post.status === "success" ? "성공" : "실패"}
                  </div>
                  {editingPostId === post.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="flex-grow"
                      />
                      <Button onClick={handleSave}>저장</Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => handleEdit(post.id)}>편집</Button>
                      {post.status === "success" && post.permalink && (
                        <a
                          href={post.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 text-xs hover:underline"
                        >
                          Threads 링크 보기
                        </a>
                      )}
                    </div>
                  )}
                </div>
                {editingPostId !== post.id ? (
                  <p className="text-gray-600 text-sm mb-1">
                    {post.content.substring(0, 50)}...
                  </p>
                ) : (
                  <p className="text-gray-600 text-sm">
                    {editedContent.substring(0, 50)}...
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}