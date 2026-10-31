import React from "react";
import { Button } from "../ui/button";

interface ThreadsLoginButtonProps {
  onLogin: () => void;
  isConnected: boolean;
  username?: string;
  onLogout: () => void;
}

export function ThreadsLoginButton({
  onLogin,
  isConnected,
  username,
  onLogout,
}: ThreadsLoginButtonProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {isConnected ? (
        <div className="flex items-center gap-2">
          <span>Connected as: {username}</span>
          <Button variant="outline" onClick={onLogout}>
            Disconnect Threads
          </Button>
        </div>
      ) : (
        <Button onClick={onLogin}>스레드로그인</Button>
      )}
    </div>
  );
}