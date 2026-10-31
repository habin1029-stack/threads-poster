import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void;
}

function Input({ className, onValueChange, onChange, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-threads-border bg-threads-surface px-3 py-2 text-sm text-threads-text placeholder:text-threads-muted focus:outline-none focus:ring-2 focus:ring-threads-accent disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onChange={(e) => {
        onChange?.(e as any);
        onValueChange?.(e.target.value);
      }}
      {...props}
    />
  );
}

export { Input };