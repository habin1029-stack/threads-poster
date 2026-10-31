import * as React from "react";

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

function Select({ value, onValueChange, disabled, children }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-threads-border bg-threads-surface px-3 py-2 text-sm text-threads-text placeholder:text-threads-muted focus:outline-none focus:ring-2 focus:ring-threads-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>{value || "선택"}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-threads-muted transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-threads-border bg-threads-card shadow-lg">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, {
                onSelect: (val: string) => {
                  onValueChange?.(val);
                  setOpen(false);
                },
              });
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}

function SelectItem({
  value,
  children,
  onSelect,
}: {
  value: string;
  children: React.ReactNode;
  onSelect?: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(value)}
      className="w-full px-3 py-2 text-sm text-left text-threads-text hover:bg-threads-surface"
    >
      {children}
    </button>
  );
}

export { Select, SelectItem };